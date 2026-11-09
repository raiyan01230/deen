import { PrayerStatus } from './index';

export interface ImprovementLog {
  id: string; // Typically date string YYYY-MM-DD
  date: string;
  salah: {
    fajr: PrayerStatus;
    dhuhr: PrayerStatus;
    asr: PrayerStatus;
    maghrib: PrayerStatus;
    isha: PrayerStatus;
  };
  ghibahTrack: {
    committedGhibah: boolean;
    participatedInGhibah: boolean;
    laughedAtMockery: boolean;
    stoppedInappropriateConv: boolean;
    reactionNotes: string;
  };
  eventDescription: string;
  goodDeeds: string;
  mistakes: string;
  todayLessons: string;
  tomorrowGoals: string;
  updatedAt: string;
}

export interface ChallengeTask {
  id: string;
  dayNumber: number;
  titleBn: string;
  descriptionBn: string;
  taskBn: string;
  guidanceBn: string;
}

export interface Challenge {
  id: number;
  titleBn: string;
  descriptionBn: string;
  tasks: ChallengeTask[];
}

export interface UserChallengeProgress {
  currentChallengeId: number;
  completedTaskIds: string[]; // e.g., ["ch1_day1", "ch1_day2"]
  lastTaskCompletedAt?: string;
}
