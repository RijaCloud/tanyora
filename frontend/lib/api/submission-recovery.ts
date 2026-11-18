type WordPressSubmissionError = Error & {
  status?: number;
  body?: string;
};

export function isSubmissionStillProcessing(error: unknown): boolean {
  if (error instanceof Error && error.message === "Le service de publication met trop de temps a repondre.") {
    return true;
  }

  const requestError = error as WordPressSubmissionError;
  return requestError.status === 409 && String(requestError.body || requestError.message).includes("platform_submissions_request_in_progress");
}
