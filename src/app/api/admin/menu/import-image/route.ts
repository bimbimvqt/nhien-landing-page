import { NextResponse } from 'next/server';
import { Category } from '@/types';

const allowedCategories: Category[] = [
  'Cà phê',
  'Cold brew',
  'Signature',
  'Matcha',
  'Cacao',
  'Trà',
  'Món khác',
];

type ImportedMenuItem = {
  name: string;
  description: string | null;
  price_s: number | null;
  price_m: number | null;
  category: Category;
  sub_category: string | null;
  is_best_seller: boolean;
  confidence: number;
};

const menuImportSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'description',
          'price_s',
          'price_m',
          'category',
          'sub_category',
          'is_best_seller',
          'confidence',
        ],
        properties: {
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          price_s: { type: ['number', 'null'] },
          price_m: { type: ['number', 'null'] },
          category: { type: 'string', enum: allowedCategories },
          sub_category: { type: ['string', 'null'] },
          is_best_seller: { type: 'boolean' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
};

function getOutputText(response: unknown) {
  const choices = (response as { choices?: Array<{ message?: { content?: string } }> }).choices;
  if (choices && choices.length > 0 && choices[0].message?.content) {
    return choices[0].message.content;
  }
  
  // Fallback if the proxy returns a raw output_text
  if (
    typeof response === 'object' &&
    response !== null &&
    'output_text' in response &&
    typeof (response as any).output_text === 'string'
  ) {
    return (response as any).output_text;
  }

  return null;
}

function normalizePrice(value: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;

  return value >= 1000 ? Math.round(value / 1000) : value;
}

function normalizeItem(item: ImportedMenuItem): ImportedMenuItem {
  return {
    name: item.name.trim(),
    description: item.description?.trim() || null,
    price_s: normalizePrice(item.price_s),
    price_m: normalizePrice(item.price_m),
    category: allowedCategories.includes(item.category) ? item.category : 'Món khác',
    sub_category: item.sub_category?.trim() || null,
    is_best_seller: Boolean(item.is_best_seller),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Thiếu OPENAI_API_KEY trong environment.' },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('image');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Vui lòng chọn ảnh menu.' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Tệp được chọn không phải ảnh.' }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ảnh menu tối đa 8MB.' }, { status: 400 });
  }

  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const imageDataUrl = `data:${file.type};base64,${imageBuffer.toString('base64')}`;

  const baseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MENU_IMPORT_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'Bạn là hệ thống nhập liệu menu cho quán cafe Việt Nam.',
                'Hãy đọc ảnh menu và trích xuất toàn bộ món uống/món ăn nhìn thấy được.',
                'Không tự bịa món không có trong ảnh.',
                'Giá trả về theo đơn vị nghìn đồng. Ví dụ 35.000đ hoặc 35k thì trả 35.',
                'Nếu menu chỉ có một giá, đặt vào price_m và để price_s là null.',
                'Nếu có nhiều size, map size nhỏ vào price_s và size vừa/lớn/phổ biến vào price_m.',
                'Chọn category gần nhất trong danh sách cho phép.',
                'description có thể null nếu ảnh không có mô tả rõ.',
              ].join(' '),
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'menu_import',
          strict: true,
          schema: menuImportSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return NextResponse.json(
      { error: `Không thể nhận diện menu: ${errorBody}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const outputText = getOutputText(data);

  if (!outputText) {
    return NextResponse.json(
      { error: 'Không đọc được kết quả nhận diện từ model.' },
      { status: 502 }
    );
  }

  const parsed = JSON.parse(outputText) as { items?: ImportedMenuItem[] };
  const items = (parsed.items || [])
    .map(normalizeItem)
    .filter((item) => item.name && (item.price_s !== null || item.price_m !== null));

  return NextResponse.json({ items });
}
