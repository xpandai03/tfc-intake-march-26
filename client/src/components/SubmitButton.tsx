import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isSubmitting: boolean;
  submitText?: string;
  submittingText?: string;
  privacyText?: string;
}

export default function SubmitButton({ isSubmitting, submitText = "Submit Request", submittingText = "Submitting...", privacyText = "Your information is protected by HIPAA privacy standards." }: SubmitButtonProps) {
  return (
    <div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isSubmitting ? submittingText : submitText}
      </Button>
      <p className="text-xs text-gray-500 mt-3 text-center">
        {privacyText}
      </p>
    </div>
  );
}
