// API route constants for client and server

export const API_PATHS = {    
    // Fixed paths
    QUESTIONS: "/api/questions",
    RESULTS: "/api/results",
    USER_SETTINGS: "/api/user/settings",
    USER_PASSWORD: "/api/user/password",
    TESTS: "/api/tests",
    AUTH_REGISTER: "/api/auth/register",
    
    // Dynamic paths
    getQuestionsByTestId: (testId: string) => `/api/questions?testId=${testId}`,
    getQuestionExplanation: (questionId: string) => `/api/questions/${questionId}/explanation`,
};
