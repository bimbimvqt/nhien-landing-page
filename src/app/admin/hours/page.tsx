'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Info,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_STORE_SETTINGS,
  extractGoogleMapsEmbedUrl,
  getGoogleMapsEmbedUrl,
  normalizeStoreSettings,
} from '@/lib/storeSettings';
import type { OpeningHour, StoreSettings } from '@/types';

type StoreSettingsForm = Pick<
  StoreSettings,
  | 'brand_name'
  | 'hotline'
  | 'address'
  | 'facebook_url'
  | 'instagram_url'
  | 'map_embed_url'
  | 'opening_hours'
>;

const createDefaultForm = (): StoreSettingsForm => ({
  brand_name: DEFAULT_STORE_SETTINGS.brand_name,
  hotline: DEFAULT_STORE_SETTINGS.hotline,
  address: DEFAULT_STORE_SETTINGS.address,
  facebook_url: DEFAULT_STORE_SETTINGS.facebook_url,
  instagram_url: DEFAULT_STORE_SETTINGS.instagram_url,
  map_embed_url: DEFAULT_STORE_SETTINGS.map_embed_url,
  opening_hours: DEFAULT_STORE_SETTINGS.opening_hours,
});

const timeOptions = Array.from({ length: 48 }).map((_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const HoursSettingsPage = () => {
  const [formData, setFormData] = useState<StoreSettingsForm>(createDefaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    const { data, error } = await supabase
      .from('store_settings')
      .select('brand_name, hotline, address, facebook_url, instagram_url, map_embed_url, opening_hours')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const settings = normalizeStoreSettings(data);
    setFormData({
      brand_name: settings.brand_name,
      hotline: settings.hotline,
      address: settings.address,
      facebook_url: settings.facebook_url,
      instagram_url: settings.instagram_url,
      map_embed_url: settings.map_embed_url,
      opening_hours: settings.opening_hours,
    });
    setLoading(false);
  };

  useEffect(() => {
    let isActive = true;

    supabase
      .from('store_settings')
      .select('brand_name, hotline, address, facebook_url, instagram_url, map_embed_url, opening_hours')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isActive) {
          return;
        }

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        const settings = normalizeStoreSettings(data);
        setFormData({
          brand_name: settings.brand_name,
          hotline: settings.hotline,
          address: settings.address,
          facebook_url: settings.facebook_url,
          instagram_url: settings.instagram_url,
          map_embed_url: settings.map_embed_url,
          opening_hours: settings.opening_hours,
        });
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const updateField = <Key extends keyof StoreSettingsForm>(
    key: Key,
    value: StoreSettingsForm[Key],
  ) => {
    setFormData((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setError(null);
  };

  const updateMapEmbedUrl = (value: string) => {
    updateField('map_embed_url', extractGoogleMapsEmbedUrl(value));
  };

  const updateOpeningHour = (
    index: number,
    key: keyof OpeningHour,
    value: OpeningHour[keyof OpeningHour],
  ) => {
    setFormData((current) => ({
      ...current,
      opening_hours: current.opening_hours.map((hour, hourIndex) =>
        hourIndex === index ? { ...hour, [key]: value } : hour,
      ),
    }));
    setMessage(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mapEmbedUrl = getGoogleMapsEmbedUrl(formData.map_embed_url);

    if (formData.map_embed_url?.trim() && !mapEmbedUrl) {
      setMessage(null);
      setError('Link bản đồ chưa đúng. Hãy dùng URL trong phần Nhúng bản đồ của Google Maps, bắt đầu bằng https://www.google.com/maps/embed.');
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    const { error } = await supabase
      .from('store_settings')
      .upsert(
        {
          id: 1,
          brand_name: formData.brand_name.trim() || DEFAULT_STORE_SETTINGS.brand_name,
          hotline: formData.hotline.trim() || DEFAULT_STORE_SETTINGS.hotline,
          address: formData.address.trim() || DEFAULT_STORE_SETTINGS.address,
          facebook_url: formData.facebook_url?.trim() || null,
          instagram_url: formData.instagram_url?.trim() || null,
          map_embed_url: mapEmbedUrl || null,
          opening_hours: formData.opening_hours,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setMessage('Đã lưu cài đặt cửa hàng.');
    setSaving(false);
  };

  const handleResetDefaults = () => {
    setFormData(createDefaultForm());
    setMessage(null);
    setError(null);
  };

  const mapPreviewUrl = getGoogleMapsEmbedUrl(formData.map_embed_url);
  const hasMapValue = Boolean(formData.map_embed_url?.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Cài đặt cửa hàng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tùy chỉnh thông tin vận hành và liên hệ của Nhiên Cafe.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading || saving}
            className="h-10 rounded-xl border-border bg-card px-4"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            type="submit"
            disabled={loading || saving}
            className="h-10 rounded-xl bg-primary px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu tất cả thay đổi
          </Button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            error
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {error ? <ShieldCheck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {error || message}
        </div>
      )}

      <Tabs defaultValue="hours" className="w-full space-y-6">
        <TabsList className="inline-flex h-auto w-full flex-wrap justify-start rounded-2xl border border-border/50 bg-muted p-1 sm:w-auto">
          <TabsTrigger
            value="hours"
            className="rounded-xl px-4 py-2.5 text-xs font-bold transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm sm:px-6"
          >
            <Clock className="h-3.5 w-3.5" />
            Thời gian hoạt động
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="rounded-xl px-4 py-2.5 text-xs font-bold transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm sm:px-6"
          >
            <Building2 className="h-3.5 w-3.5" />
            Thông tin cơ bản
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="rounded-xl px-4 py-2.5 text-xs font-bold transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm sm:px-6"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Nâng cao
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="overflow-hidden rounded-[32px] border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 bg-card p-8">
              <div className="mb-2 flex items-center gap-3 text-primary">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Operational Schedule
                </span>
              </div>
              <CardTitle className="text-2xl font-black italic text-foreground">
                Lịch làm việc hàng tuần
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Thiết lập thời gian mở và đóng cửa chính xác để khách hàng nắm bắt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 bg-card p-4 sm:p-8">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                formData.opening_hours.map((hour, index) => (
                  <div
                    key={hour.day}
                    className="group grid gap-4 rounded-2xl border border-transparent p-4 transition-all hover:border-border/50 hover:bg-muted/50 md:grid-cols-[8rem_1fr_8rem] md:items-center"
                  >
                    <div className="font-bold text-foreground transition-colors group-hover:text-primary">
                      {hour.day}
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <Select
                        value={hour.open}
                        disabled={hour.closed || saving}
                        onValueChange={(value) => updateOpeningHour(index, 'open', value)}
                      >
                        <SelectTrigger className="h-11 w-[8rem] sm:w-[9rem] rounded-xl bg-background px-4">
                          <SelectValue placeholder="Chọn giờ" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                      <Select
                        value={hour.close}
                        disabled={hour.closed || saving}
                        onValueChange={(value) => updateOpeningHour(index, 'close', value)}
                      >
                        <SelectTrigger className="h-11 w-[8rem] sm:w-[9rem] rounded-xl bg-background px-4">
                          <SelectValue placeholder="Chọn giờ" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 md:justify-end">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={!hour.closed}
                          disabled={saving}
                          onChange={(event) => updateOpeningHour(index, 'closed', !event.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none rtl:peer-checked:after:-translate-x-full" />
                      </label>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 group-hover:text-muted-foreground">
                        {hour.closed ? 'Nghỉ' : 'Mở cửa'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="overflow-hidden rounded-[32px] border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 bg-card p-8">
              <CardTitle className="text-xl font-bold text-foreground">
                Thông tin liên hệ & Thương hiệu
              </CardTitle>
              <CardDescription>
                Thông tin này sẽ được hiển thị công khai ở chân trang và trang liên hệ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 bg-card p-8">
              <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-3">
                  <FieldLabel icon={Info}>Tên thương hiệu</FieldLabel>
                  <Input
                    value={formData.brand_name}
                    disabled={loading || saving}
                    onChange={(event) => updateField('brand_name', event.target.value)}
                    className="h-14 rounded-2xl border-transparent bg-muted/30 px-5 text-base font-bold text-foreground transition-all focus-visible:border-border focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/5"
                  />
                </div>
                <div className="space-y-3">
                  <FieldLabel icon={Phone}>Hotline hỗ trợ</FieldLabel>
                  <Input
                    value={formData.hotline}
                    disabled={loading || saving}
                    onChange={(event) => updateField('hotline', event.target.value)}
                    className="h-14 rounded-2xl border-transparent bg-muted/30 px-5 text-base font-bold text-foreground transition-all focus-visible:border-border focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/5"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel icon={MapPin}>Địa chỉ cửa hàng</FieldLabel>
                <Input
                  value={formData.address}
                  disabled={loading || saving}
                  onChange={(event) => updateField('address', event.target.value)}
                  className="h-14 rounded-2xl border-transparent bg-muted/30 px-5 text-base font-medium text-foreground transition-all focus-visible:border-border focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/5"
                />
              </div>

              <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-3">
                  <FieldLabel icon={Globe}>Facebook URL</FieldLabel>
                  <Input
                    type="url"
                    value={formData.facebook_url || ''}
                    disabled={loading || saving}
                    onChange={(event) => updateField('facebook_url', event.target.value)}
                    placeholder="https://facebook.com/nhiencafe"
                    className="h-14 rounded-2xl border-transparent bg-muted/30 px-5 text-sm text-foreground transition-all focus-visible:border-border focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/5"
                  />
                </div>
                <div className="space-y-3">
                  <FieldLabel icon={BellRing}>Instagram URL</FieldLabel>
                  <Input
                    type="url"
                    value={formData.instagram_url || ''}
                    disabled={loading || saving}
                    onChange={(event) => updateField('instagram_url', event.target.value)}
                    placeholder="https://instagram.com/nhiencafe"
                    className="h-14 rounded-2xl border-transparent bg-muted/30 px-5 text-sm text-foreground transition-all focus-visible:border-border focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/5"
                  />
                </div>
              </div>

	              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
	                <div className="space-y-3">
	                  <FieldLabel icon={MapPin}>Google Maps Embed URL</FieldLabel>
	                  <Input
	                    type="url"
	                    value={formData.map_embed_url || ''}
	                    disabled={loading || saving}
	                    onChange={(event) => updateMapEmbedUrl(event.target.value)}
	                    placeholder="https://www.google.com/maps/embed?pb=..."
	                    className={`h-14 rounded-2xl bg-muted/30 px-5 text-sm text-foreground transition-all focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/5 ${
	                      hasMapValue && !mapPreviewUrl
	                        ? 'border-rose-500/60 focus-visible:border-rose-500 focus-visible:ring-rose-500/10'
	                        : 'border-transparent focus-visible:border-border'
	                    }`}
	                  />
	                  <p className="ml-1 text-xs leading-5 text-muted-foreground">
	                    Google Maps: Chia sẻ → Nhúng bản đồ → copy URL trong thuộc tính src.
	                  </p>
	                </div>
	                <div className="overflow-hidden rounded-3xl border border-border bg-muted/30">
	                  {mapPreviewUrl ? (
	                    <iframe
	                      src={mapPreviewUrl}
	                      title="Map preview"
	                      className="h-48 w-full"
	                      style={{ border: 0 }}
	                      loading="lazy"
	                    />
	                  ) : hasMapValue ? (
	                    <div className="flex h-48 items-center justify-center p-6 text-center text-sm font-semibold text-rose-600 dark:text-rose-300">
	                      Link này không thể nhúng. Hãy copy URL trong thuộc tính src của iframe Google Maps.
	                    </div>
	                  ) : (
	                    <div className="flex h-48 items-center justify-center p-6 text-center text-sm font-semibold text-muted-foreground">
	                      Nhập URL nhúng Google Maps để xem trước.
	                    </div>
	                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="overflow-hidden rounded-[32px] border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 bg-card p-8">
              <CardTitle className="text-xl font-bold text-foreground">
                Thiết lập nhanh
              </CardTitle>
              <CardDescription>
                Khôi phục giá trị mặc định khi cần nhập lại thông tin vận hành từ đầu.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-foreground">Đưa biểu mẫu về mặc định</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thao tác này chỉ đổi dữ liệu trên màn hình. Bấm lưu để cập nhật Supabase.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={loading || saving}
                onClick={handleResetDefaults}
                className="h-12 rounded-2xl border-border bg-background px-5 font-bold"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Khôi phục mặc định
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
};

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </Label>
  );
}

export default HoursSettingsPage;
