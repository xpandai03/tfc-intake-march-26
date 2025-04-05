import { CheckCircle, XCircle } from "lucide-react";

interface FormResponseProps {
  status: "success" | "error";
  message?: string;
}

export default function FormResponse({ status, message }: FormResponseProps) {
  const isSuccess = status === "success";
  
  return (
    <div className="mt-6">
      <div
        className={`${
          isSuccess
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        } rounded-md p-4`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            {isSuccess ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="ml-3">
            <p
              className={`text-sm font-medium ${
                isSuccess ? "text-green-800" : "text-red-800"
              }`}
            >
              {message || (isSuccess
                ? "Thank you! Your form has been submitted successfully."
                : "Sorry, there was an error submitting your form. Please try again.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
