'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Sidebar & Navigation
    'nav.dashboard': 'Bảng điều khiển',
    'nav.menu': 'Thực đơn',
    'nav.hero': 'Ảnh Hero',
    'nav.about': 'Về chúng tôi',
    'nav.gallery': 'Không gian / Thư viện',
    'nav.banners': 'Banners & Hình ảnh',
    'nav.promotions': 'Chương trình Ưu đãi',
    'nav.redeem': 'Áp dụng mã tại quầy',
    'nav.loyalty': 'Thành viên & Điểm',
    'nav.hours': 'Cài đặt & Giờ mở cửa',
    'nav.overview': 'TỔNG QUAN',
    'nav.pos': 'POS Tại Quầy',
    'nav.pos_category': '⚡ TẠI QUẦY',
    'nav.management': 'QUẢN LÝ',
    'nav.system': 'HỆ THỐNG',
    'nav.brandName': 'Nhà Nhiên',
    
    // Header & Actions
    'header.searchPlaceholder': 'Tìm kiếm nhanh...',
    'header.searchPlaceholderFull': 'Tìm kiếm món ăn, thành viên, khuyến mãi, tính năng...',
    'header.recentActivity': 'Hoạt động gần đây',
    'header.manageMembers': 'Quản lý thành viên',
    'header.noNewActivity': 'Không có hoạt động mới nào',
    'header.loadingActivity': 'Đang tải hoạt động mới...',
    'header.admin': 'Quản trị viên',
    'header.adminRole': 'Quản trị viên hệ thống',
    'header.storeSettings': 'Cài đặt cửa hàng',
    'header.backHome': 'Quay lại Trang chủ',
    'header.logout': 'Đăng xuất',
    
    // Hours / Settings Page
    'hours.title': 'Cài đặt cửa hàng',
    'hours.subtitle': 'Tùy chỉnh thông tin vận hành và liên hệ của Nhiên Cafe.',
    'hours.refresh': 'Làm mới',
    'hours.saveAll': 'Lưu tất cả thay đổi',
    'hours.operationalSchedule': 'Thời gian hoạt động',
    'hours.basicInfo': 'Thông tin cơ bản',
    'hours.advanced': 'Nâng cao',
    'hours.requiredTasksToClaim': 'Số nhiệm vụ tối thiểu để nhận mã',
    'hours.requiredTasksToClaimDesc': 'Số lượng nhiệm vụ khách hàng cần hoàn thành (like fanpage, share bài, chia sẻ cảm nghĩ...) để có thể đổi mã quà tặng khuyến mãi.',
    'hours.tasksTitle': 'Quản lý nhiệm vụ nhận thưởng',
    'hours.tasksDesc': 'Tùy chỉnh tiêu đề, mô tả, nút hành động hoặc bật/tắt các nhiệm vụ nhận ưu đãi ngoài trang chủ.',
    'hours.taskActive': 'Kích hoạt nhiệm vụ này',
    'hours.taskTitleLabel': 'Tên nhiệm vụ',
    'hours.taskDescLabel': 'Mô tả nhiệm vụ',
    'hours.taskRewardLabel': 'Mô tả phần thưởng (ví dụ: Mở khóa mã giảm giá...)',
    'hours.taskActionLabel': 'Nhãn nút hành động (ví dụ: Xem thực đơn...)',
    'hours.weeklyTitle': 'Lịch làm việc hàng tuần',
    'hours.weeklyDesc': 'Thiết lập thời gian mở và đóng cửa chính xác để khách hàng nắm bắt.',
    'hours.brandName': 'Tên thương hiệu',
    'hours.hotline': 'Hotline hỗ trợ',
    'hours.address': 'Địa chỉ cửa hàng',
    'hours.facebook': 'Facebook URL',
    'hours.instagram': 'Instagram URL',
    'hours.googleMaps': 'Google Maps Embed URL',
    'hours.googleMapsDesc': 'Google Maps: Chia sẻ → Nhúng bản đồ → copy URL trong thuộc tính src.',
    'hours.mapPreview': 'Xem trước bản đồ',
    'hours.mapCannotEmbed': 'Link này không thể nhúng. Hãy copy URL trong thuộc tính src của iframe Google Maps.',
    'hours.mapInputToPreview': 'Nhập URL nhúng Google Maps để xem trước.',
    
    // Advanced Settings
    'hours.advancedTitle': 'Khôi phục & Thiết lập nâng cao',
    'hours.advancedDesc': 'Quản lý các trạng thái biểu mẫu cài đặt và cơ sở dữ liệu của Nhiên CàFe.',
    'hours.revertTitle': 'Hủy thay đổi và tải lại dữ liệu đã lưu',
    'hours.revertDesc': 'Khôi phục lại toàn bộ dữ liệu của biểu mẫu về giá trị đang lưu thành công gần nhất trên Supabase.',
    'hours.revertBtn': 'Hủy các thay đổi',
    'hours.factoryTitle': 'Đưa biểu mẫu về mặc định của hệ thống',
    'hours.factoryDesc': 'Xóa các giá trị hiện tại trên màn hình và điền lại cấu hình mặc định ban đầu của thương hiệu Nhiên Cafe.',
    'hours.factoryBtn': 'Khôi phục mặc định',
    'hours.revertConfirmTitle': 'Xác nhận hủy thay đổi?',
    'hours.revertConfirmDesc': 'Hành động này sẽ xóa sạch tất cả những gì bạn đang chỉnh sửa trên các tab và đưa các ô nhập liệu về giá trị đang lưu trên database. Bạn có muốn tiếp tục?',
    'hours.factoryConfirmTitle': 'Xác nhận thiết lập lại mặc định?',
    'hours.factoryConfirmDesc': 'Hành động này sẽ tải các cấu hình mặc định ban đầu của Nhiên CàFe (Tên, địa chỉ, giờ mở cửa mặc định). Bạn sẽ cần bấm "Lưu tất cả thay đổi" sau khi xác nhận để áp dụng lên cơ sở dữ liệu.',
    'hours.btnCancel': 'Hủy bỏ',
    'hours.btnConfirm': 'Xác nhận khôi phục',
    'hours.btnConfirmFactory': 'Đồng ý thiết lập lại',
  },
  en: {
    // Sidebar & Navigation
    'nav.dashboard': 'Dashboard',
    'nav.menu': 'Menu Manager',
    'nav.hero': 'Hero Layout',
    'nav.about': 'About Us',
    'nav.gallery': 'Gallery',
    'nav.banners': 'Banners & Ads',
    'nav.promotions': 'Promotions',
    'nav.redeem': 'Redeem Code',
    'nav.loyalty': 'Members & Stamps',
    'nav.hours': 'Store Settings',
    'nav.overview': 'OVERVIEW',
    'nav.pos': 'POS Cashier',
    'nav.pos_category': '⚡ CASHIER',
    'nav.management': 'MANAGEMENT',
    'nav.system': 'SYSTEM',
    'nav.brandName': 'Nhien Cafe',
    
    // Header & Actions
    'header.searchPlaceholder': 'Quick search...',
    'header.searchPlaceholderFull': 'Search products, members, promotions, pages...',
    'header.recentActivity': 'Recent Activities',
    'header.manageMembers': 'Manage Members',
    'header.noNewActivity': 'No new activities',
    'header.loadingActivity': 'Loading recent activities...',
    'header.admin': 'Administrator',
    'header.adminRole': 'System Administrator',
    'header.storeSettings': 'Store Settings',
    'header.backHome': 'Back to Homepage',
    'header.logout': 'Sign Out',
    
    // Hours / Settings Page
    'hours.title': 'Store Settings',
    'hours.subtitle': 'Customize operating and contact information of Nhien Cafe.',
    'hours.refresh': 'Refresh',
    'hours.saveAll': 'Save All Changes',
    'hours.operationalSchedule': 'Operational Hours',
    'hours.basicInfo': 'Basic Info',
    'hours.advanced': 'Advanced',
    'hours.requiredTasksToClaim': 'Required tasks to claim promo code',
    'hours.requiredTasksToClaimDesc': 'The minimum number of tasks a customer must complete (e.g. facebook like, share, profile complete...) to claim promotional reward vouchers.',
    'hours.tasksTitle': 'Reward Tasks Management',
    'hours.tasksDesc': 'Customize the titles, descriptions, action buttons, or toggle active status of promotional reward tasks shown on homepage.',
    'hours.taskActive': 'Activate this task',
    'hours.taskTitleLabel': 'Task Title',
    'hours.taskDescLabel': 'Task Description',
    'hours.taskRewardLabel': 'Display Reward (e.g. Unlock voucher...)',
    'hours.taskActionLabel': 'Action Button Label (e.g. View menu...)',
    'hours.weeklyTitle': 'Weekly Operational Schedule',
    'hours.weeklyDesc': 'Configure opening and closing hours for customers to see.',
    'hours.brandName': 'Brand Name',
    'hours.hotline': 'Support Hotline',
    'hours.address': 'Store Address',
    'hours.facebook': 'Facebook URL',
    'hours.instagram': 'Instagram URL',
    'hours.googleMaps': 'Google Maps Embed URL',
    'hours.googleMapsDesc': 'Google Maps: Share → Embed a map → copy URL inside the src attribute.',
    'hours.mapPreview': 'Map Preview',
    'hours.mapCannotEmbed': 'This link cannot be embedded. Please copy URL in the src attribute of Google Maps iframe.',
    'hours.mapInputToPreview': 'Enter Google Maps Embed URL to preview.',
    
    // Advanced Settings
    'hours.advancedTitle': 'Reset & Advanced Settings',
    'hours.advancedDesc': 'Manage configuration form states and database settings.',
    'hours.revertTitle': 'Cancel Changes & Reload Saved Data',
    'hours.revertDesc': 'Restore all form inputs to the last successfully saved configuration on Supabase.',
    'hours.revertBtn': 'Cancel Changes',
    'hours.factoryTitle': 'Reset to Factory Defaults',
    'hours.factoryDesc': 'Wipe current inputs on screen and reload original default brand values of Nhien Cafe.',
    'hours.factoryBtn': 'Restore Defaults',
    'hours.revertConfirmTitle': 'Cancel all unsaved changes?',
    'hours.revertConfirmDesc': 'This will revert all unsaved input modifications on screen back to the last successfully saved state in Supabase. Do you wish to proceed?',
    'hours.factoryConfirmTitle': 'Reset to factory defaults?',
    'hours.factoryConfirmDesc': 'This will reload system defaults for Nhien Cafe (Name, hotline, default hours). You will need to press "Save All Changes" to apply this overwrite onto Supabase.',
    'hours.btnCancel': 'Cancel',
    'hours.btnConfirm': 'Yes, Restore Saved',
    'hours.btnConfirmFactory': 'Yes, Reset Default',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['vi']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('admin_lang') as Language;
    if (saved === 'vi' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('admin_lang', lang);
  };

  const t = (key: keyof typeof translations['vi']): string => {
    const dict = translations[language] || translations['vi'];
    return dict[key] || translations['vi'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useAdminLanguage must be used within a LanguageProvider');
  }
  return context;
}
