import {
    CaseOutcomePrediction,
    TimeToResolutionForecast,
    AttorneyMetrics,
    PracticeAreaTrend
} from '../../types';

export interface AnalyticsState {
    predictions: CaseOutcomePrediction[];
    forecasts: TimeToResolutionForecast[];
    attorneyMetrics: Record<string, AttorneyMetrics>;
    practiceAreaTrends: PracticeAreaTrend[];
    setPredictions: (predictions: CaseOutcomePrediction[]) => void;
    setForecasts: (forecasts: TimeToResolutionForecast[]) => void;
    setAttorneyMetrics: (userId: string, metrics: AttorneyMetrics) => void;
    setPracticeAreaTrends: (trends: PracticeAreaTrend[]) => void;
}

export const createAnalyticsSlice = (set: any, get: any, api: any): AnalyticsState => ({
    predictions: [],
    forecasts: [],
    attorneyMetrics: {},
    practiceAreaTrends: [],
    setPredictions: (predictions) => set({ predictions }),
    setForecasts: (forecasts) => set({ forecasts }),
    setAttorneyMetrics: (userId, metrics) => set((state: any) => ({
        attorneyMetrics: { ...state.attorneyMetrics, [userId]: metrics }
    })),
    setPracticeAreaTrends: (trends) => set({ practiceAreaTrends: trends }),
});
