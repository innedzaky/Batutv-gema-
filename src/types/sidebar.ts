export interface SidebarAdBanner {
  enabled: boolean;
  title: string;
  imageUrl?: string;
  targetUrl?: string;
  size?: 'medium' | 'skyscraper';
}

export interface HomepageSidebarConfig {
  enabled: boolean;
  sticky: boolean;
  popularWidget: {
    enabled: boolean;
    title: string;
    timeframe: string;
    limit: number;
  };
  specialEventWidget: {
    enabled: boolean;
    title: string;
    eventTitle: string;
    eventDescription: string;
    eventBadge: string;
    eventImageUrl?: string;
    actionText?: string;
    actionUrl?: string;
  };
  adBannerWidget: SidebarAdBanner;
  trendingWidget: {
    enabled: boolean;
    title: string;
    limit: number;
    showButton: boolean;
  };
  viralTopicsWidget: {
    enabled: boolean;
    title: string;
    limit: number;
  };
}

export interface ArticleSidebarConfig {
  enabled: boolean;
  sticky: boolean;
  popularWidget: {
    enabled: boolean;
    title: string;
    timeframe: string;
    limit: number;
  };
  discussionWidget: {
    enabled: boolean;
    title: string;
    timeframe: string;
    limit: number;
  };
  topicsWidget: {
    enabled: boolean;
    title: string;
    limit: number;
  };
  adBannerWidget: SidebarAdBanner;
}

export interface VideoSidebarConfig {
  enabled: boolean;
  sticky: boolean;
  popularWidget: {
    enabled: boolean;
    title: string;
    timeframe: string;
    limit: number;
  };
  relatedVideosWidget: {
    enabled: boolean;
    title: string;
    limit: number;
  };
  adBannerWidget: SidebarAdBanner;
}

export interface GlobalSidebarSettings {
  homepage: HomepageSidebarConfig;
  article: ArticleSidebarConfig;
  video: VideoSidebarConfig;
  updatedAt?: string;
}
