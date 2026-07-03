export const CONSISTENT_CHECKIN_TESTS = [
    {
        streakCount: 0,
        occurred: false,
        coinBalance: 300,
        coinEarned: 0,
    },
    {
        streakCount: 1,
        occurred: true,
        coinBalance: 310,
        coinEarned: 10,
    },
    {
        streakCount: 2,
        occurred: true,
        coinBalance: 320,
        coinEarned: 10,
    },
    {
        streakCount: 3,
        occurred: true,
        coinBalance: 330,
        coinEarned: 10,
    },
    {
        streakCount: 4,
        occurred: true,
        coinBalance: 340,
        coinEarned: 10,
    },
    {
        streakCount: 5,
        occurred: true,
        coinBalance: 350,
        coinEarned: 10,
    },
    {
        streakCount: 6,
        occurred: true,
        coinBalance: 360,
        coinEarned: 10,
    }
];

export const CONSISTENT_CHECKIN_TESTS_WITH_MISSED_DAY = [
    {
        streakCount: 0,
        occurred: false,
        coinBalance: 300,
        coinEarned: 0,
        skipped: false,
    },
    {
        streakCount: 1,
        occurred: true,
        coinBalance: 310,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 2,
        occurred: true,
        coinBalance: 320,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 3,
        occurred: true,
        coinBalance: 330,
        coinEarned: 10,
        skipped: false,
    },
    {
        occurred: false,
        streakCount: 0,
        coinBalance: 330,
        coinEarned: 0,
        skipped: true,
    },
    {
        streakCount: 1,
        occurred: true,
        coinBalance: 340,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 2,
        occurred: true,
        coinBalance: 350,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 3,
        occurred: true,
        coinBalance: 360,
        coinEarned: 10,
        skipped: false,
    }
];

export const WEEK_STREAK_WITH_SIX_MONTHS_GAP_TESTS = [
    {
        streakCount: 0,
        occurred: false,
        coinBalance: 300,
        coinEarned: 0,
        skipped: false,
    },
    {
        streakCount: 1,
        occurred: true,
        coinBalance: 310,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 2,
        occurred: true,
        coinBalance: 320,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 3,
        occurred: true,
        coinBalance: 330,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 4,
        occurred: true,
        coinBalance: 340,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 5,
        occurred: true,
        coinBalance: 350,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 6,
        occurred: true,
        coinBalance: 360,
        coinEarned: 10,
        skipped: false,
    },
    {
        streakCount: 7,
        occurred: true,
        coinBalance: 370,
        coinEarned: 10,
        skipped: false,
    },
    {
        occurred: false,
        streakCount: 0,
        coinBalance: 370,
        coinEarned: 0,
        skipped: true,
    },
    {
        streakCount: 1,
        occurred: true,
        coinBalance: 380,
        coinEarned: 10,
        skipped: false,
    },
];
