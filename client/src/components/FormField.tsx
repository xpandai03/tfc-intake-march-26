import { FieldError, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
}

export default function FormField({
  id,
  label,
  register,
  error,
  required = false,
  type = "text",
  multiline = false,
  rows = 3,
}: FormFieldProps) {
  return (
    <div>
      <Label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      {multiline ? (
        <Textarea
          id={id}
          {...register(id)}
          rows={rows}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        />
      ) : (
        <Input
          id={id}
          type={type}
          {...register(id)}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        />
      )}
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}
