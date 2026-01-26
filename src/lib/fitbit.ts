import { CapacitorHttp, HttpResponse } from '@capacitor/core';

export interface FitbitConnection {
  isConnected: boolean;
  accessToken?: string;
  userId?: string;
  displayName?: string;
}

// Fitbit OAuth 2.0 Implicit Grant Flow
export function getFitbitAuthUrl(redirectUri: string): string {
  const clientId = import.meta.env.VITE_FITBIT_CLIENT_ID;
  const scope = 'activity heartrate location nutrition profile settings sleep social weight';

  return `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&expires_in=31536000`;
}

// Parse OAuth callback from URL fragment
export function parseFitbitCallback(hash: string): { accessToken: string; userId: string } | null {
  if (!hash || !hash.startsWith('#')) {
    return null;
  }

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const userId = params.get('user_id');

  if (!accessToken || !userId) {
    return null;
  }

  return { accessToken, userId };
}

// Fetch Fitbit user profile
export async function fetchFitbitProfile(accessToken: string): Promise<{ displayName: string } | null> {
  try {
    const response: HttpResponse = await CapacitorHttp.get({
      url: 'https://api.fitbit.com/1/user/-/profile.json',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 200 && response.data?.user) {
      return {
        displayName: response.data.user.displayName || response.data.user.fullName
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Fitbit profile:', error);
    return null;
  }
}

// Fetch Fitbit activity data
export async function fetchFitbitActivity(accessToken: string, date: string): Promise<{ steps: number; calories: number; distance: number } | null> {
  try {
    const response: HttpResponse = await CapacitorHttp.get({
      url: `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 200 && response.data?.summary) {
      return {
        steps: response.data.summary.steps || 0,
        calories: response.data.summary.calories || 0,
        distance: response.data.summary.distances?.[0]?.distance || 0
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Fitbit activity:', error);
    return null;
  }
}

// Fetch Fitbit sleep data
export async function fetchFitbitSleep(accessToken: string, date: string): Promise<{ startTime: string; endTime: string; minutesAsleep: number; efficiency: number } | null> {
  try {
    const response: HttpResponse = await CapacitorHttp.get({
      url: `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 200 && response.data?.sleep?.[0]) {
      const sleep = response.data.sleep[0];
      return {
        startTime: sleep.startTime,
        endTime: sleep.endTime,
        minutesAsleep: sleep.minutesAsleep || 0,
        efficiency: sleep.efficiency || 0
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Fitbit sleep:', error);
    return null;
  }
}

// Fetch Fitbit weight data
export async function fetchFitbitWeight(accessToken: string, date: string): Promise<{ weight: number; bmi: number; fat: number } | null> {
  try {
    const response: HttpResponse = await CapacitorHttp.get({
      url: `https://api.fitbit.com/1/user/-/body/log/weight/date/${date}.json`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 200 && response.data?.weight?.[0]) {
      const weight = response.data.weight[0];
      return {
        weight: weight.weight || 0,
        bmi: weight.bmi || 0,
        fat: weight.fat || 0
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Fitbit weight:', error);
    return null;
  }
}

// Fetch Fitbit water data
export async function fetchFitbitWater(accessToken: string, date: string): Promise<{ water: number } | null> {
  try {
    const response: HttpResponse = await CapacitorHttp.get({
      url: `https://api.fitbit.com/1/user/-/foods/log/water/date/${date}.json`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 200 && response.data?.summary) {
      return {
        water: response.data.summary.water || 0
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Fitbit water:', error);
    return null;
  }
}

// LocalStorage helpers
const FITBIT_CONNECTION_KEY = 'fitbit_connection';

export function saveFitbitConnection(connection: FitbitConnection): void {
  localStorage.setItem(FITBIT_CONNECTION_KEY, JSON.stringify(connection));
}

export function loadFitbitConnection(): FitbitConnection {
  const stored = localStorage.getItem(FITBIT_CONNECTION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { isConnected: false };
    }
  }
  return { isConnected: false };
}

export function clearFitbitConnection(): void {
  localStorage.removeItem(FITBIT_CONNECTION_KEY);
}
