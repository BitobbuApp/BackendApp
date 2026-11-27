import { IAnalyticsProvider } from '../../domain/analyticsProvider';
import { MetaCapiProvider } from './metaCapiProvider';

export const metaCapiProvider = new MetaCapiProvider();

/**
 * Plug new server-side marketing/analytics providers here (e.g. GoogleAdsProvider, TikTokEventsProvider).
 * Business use cases stay completely agnostic to which providers are active.
 */
export const ANALYTICS_PROVIDERS: IAnalyticsProvider[] = [
    metaCapiProvider,
];

