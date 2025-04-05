import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import FormResponse from "@/components/FormResponse";
import axios from "axios";

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required").max(15),
  reasonForVisit: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function IntakeForm() {
  const [submissionStatus, setSubmissionStatus] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
  }>({
    status: "idle",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      reasonForVisit: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await axios.post(
        "https://us-central1-phitest-api.cloudfunctions.net/forwardToMake1",
        data
      );
      setSubmissionStatus({
        status: "success",
        message: "Thank you! Your form has been submitted successfully.",
      });
      reset();
    } catch (error) {
      let errorMessage = "Sorry, there was an error submitting your form. Please try again.";
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setSubmissionStatus({
        status: "error",
        message: errorMessage,
      });
      console.error("Form submission error:", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto py-8 px-4 sm:px-6 lg:py-12">
        <Card className="shadow-md">
          <CardContent className="pt-6 pb-6">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">Therapy Intake Form</h1>
              <p className="text-gray-600">Please complete this form to request services.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  id="firstName"
                  label="First Name"
                  register={register}
                  error={errors.firstName}
                  required
                />

                <FormField
                  id="lastName"
                  label="Last Name"
                  register={register}
                  error={errors.lastName}
                  required
                />
              </div>

              <FormField
                id="email"
                label="Email"
                type="email"
                register={register}
                error={errors.email}
                required
              />

              <FormField
                id="phone"
                label="Phone Number"
                type="tel"
                register={register}
                error={errors.phone}
                required
              />

              <FormField
                id="reasonForVisit"
                label="Reason for Visit"
                register={register}
                error={errors.reasonForVisit}
                multiline
                rows={4}
              />

              <SubmitButton isSubmitting={isSubmitting} />
            </form>

            {submissionStatus.status !== "idle" && (
              <FormResponse
                status={submissionStatus.status}
                message={submissionStatus.message}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
