interface FieldErrorProps {
  id: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="text-xs text-red-600 dark:text-red-400 mt-1 min-h-[1rem]"
    >
      {message ?? ''}
    </p>
  );
}
