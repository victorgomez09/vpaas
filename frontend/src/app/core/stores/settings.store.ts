import { BehaviorSubject } from 'rxjs';

import { Settings } from '../models/settings.model';

const $settingsSubject = new BehaviorSubject<Settings | null>(null);

export const settingsStore = {
  settings: $settingsSubject.asObservable(),
  setSettings: (settings: Settings) => $settingsSubject.next(settings),
};
