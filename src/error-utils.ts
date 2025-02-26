// Type guard for Error objects
export function isError(error: unknown): error is Error {
    return error instanceof Error;
  }
  
  // Safe error message extraction
  export function getErrorMessage(error: unknown): string {
    if (isError(error)) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'toString' in error) {
      return error.toString();
    }
    
    return 'Unknown error';
  }
  