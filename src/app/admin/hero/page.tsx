'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { fetchAdminApi } from '@/lib/adminApi';

const DEFAULT_HERO_BACKGROUND =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop';
const HERO_IMAGE_BUCKET = 'product-images';

export default function HeroSettingsPage() {
  const [imageUrl, setImageUrl] = useState(DEFAULT_HERO_BACKGROUND);
  const [savedImageUrl, setSavedImageUrl] = useState(DEFAULT_HERO_BACKGROUND);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  const previewUrl = imagePreviewUrl || imageUrl.trim() || DEFAULT_HERO_BACKGROUND;

  const fetchHeroSettings = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetchAdminApi('/api/admin/store-settings');
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await res.json();
      setCurrentSettings(data);
      const nextImageUrl = data?.hero_image_url || DEFAULT_HERO_BACKGROUND;
      setImageUrl(nextImageUrl);
      setSavedImageUrl(nextImageUrl);
      setSelectedImageFile(null);
      setImagePreviewUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    fetchAdminApi('/api/admin/store-settings')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
      })
      .then((data) => {
        if (!isActive) return;
        setCurrentSettings(data);
        const nextImageUrl = data?.hero_image_url || DEFAULT_HERO_BACKGROUND;
        setImageUrl(nextImageUrl);
        setSavedImageUrl(nextImageUrl);
        setSelectedImageFile(null);
        setImagePreviewUrl('');
        setLoading(false);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      isActive = false;
      setImagePreviewUrl((current) => {
        if (current.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }
        return '';
      });
    };
  }, []);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ.');
      return;
    }

    if (imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setMessage(null);
    setError(null);
  };

  const clearSelectedImage = () => {
    if (imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(null);
    setImagePreviewUrl('');
    setMessage(null);
    setError(null);
  };

  const uploadSelectedImage = async () => {
    if (!selectedImageFile) {
      return imageUrl.trim() || null;
    }

    const formData = new FormData();
    formData.append('file', selectedImageFile);
    formData.append('folder', 'hero');

    const response = await fetchAdminApi('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Không thể upload ảnh: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    let nextImageUrl: string | null;

    try {
      nextImageUrl = await uploadSelectedImage();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không thể upload ảnh Hero.');
      setSaving(false);
      return;
    }

    try {
      const updateRes = await fetchAdminApi('/api/admin/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(currentSettings || {}),
          hero_image_url: nextImageUrl,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update settings');
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
      return;
    }

    const savedUrl = nextImageUrl || DEFAULT_HERO_BACKGROUND;
    setImageUrl(savedUrl);
    setSavedImageUrl(savedUrl);
    clearSelectedImage();
    setMessage('Đã lưu ảnh Hero mới.');
    setSaving(false);
  };

  const handleResetDefault = () => {
    clearSelectedImage();
    setImageUrl(DEFAULT_HERO_BACKGROUND);
    setMessage(null);
    setError(null);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Ảnh Hero
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cài đặt ảnh nền đầu trang chủ, tách riêng khỏi banner quảng bá.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchHeroSettings}
          disabled={loading || saving}
          className="h-10 rounded-xl border-border bg-card px-4"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden rounded-[32px] border-border/50 bg-card shadow-sm">
          <CardHeader className="border-b border-border/50 bg-card p-8">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <ImageIcon className="h-4 w-4" />
              Trang chủ / Hero Section
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Hình ảnh đang hiển thị
            </CardTitle>
            <CardDescription>
              Nên dùng ảnh ngang 1920x1080px hoặc lớn hơn để hiển thị đẹp trên desktop và mobile.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 bg-card p-8">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] border border-border bg-muted">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getProxiedImageUrl(previewUrl)}
                  alt="Hero preview"
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(39,32,28,0.82),rgba(39,32,28,0.42),rgba(39,32,28,0.18))]" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="font-serif text-3xl font-bold">Nhiên CàFe</p>
                <p className="mt-2 font-serif text-xl font-light italic">Chạm vào sự thư giãn</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                id="hero-image-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) {
                    handleImageSelect(file);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={loading || saving}
                onClick={() => document.getElementById('hero-image-upload')?.click()}
                className="h-12 rounded-2xl border-border bg-muted/20 font-bold"
              >
                <Upload className="mr-2 h-4 w-4" />
                Chọn ảnh từ máy
              </Button>
              {selectedImageFile && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={clearSelectedImage}
                  className="h-12 rounded-2xl text-sm font-bold text-muted-foreground hover:text-rose-500"
                >
                  <X className="mr-2 h-4 w-4" />
                  Bỏ ảnh đã chọn
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="hero-image-url"
                className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              >
                Link hình ảnh Hero
              </Label>
              <Input
                id="hero-image-url"
                type="url"
                value={imageUrl}
                onChange={(event) => {
                  setImageUrl(event.target.value);
                  clearSelectedImage();
                  setMessage(null);
                  setError(null);
                }}
                placeholder="https://images.unsplash.com/..."
                disabled={loading || saving}
                className="h-14 rounded-2xl border-border bg-muted/20 px-5 text-base font-medium text-foreground transition-all focus-visible:border-border focus-visible:bg-background focus-visible:ring-primary/10"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit rounded-[32px] border-border/50 bg-card shadow-sm">
          <CardHeader className="p-6">
            <CardTitle className="text-lg text-foreground">Thao tác</CardTitle>
            <CardDescription>
              Lưu thay đổi để ảnh Hero ngoài trang chủ cập nhật theo URL này.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-0">
            <Button
              type="submit"
              disabled={loading || saving || (!selectedImageFile && imageUrl === savedImageUrl)}
              className="h-12 w-full rounded-2xl font-black"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu ảnh Hero
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading || saving}
              onClick={handleResetDefault}
              className="h-12 w-full rounded-2xl border-border bg-background font-bold"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Dùng ảnh mặc định
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
