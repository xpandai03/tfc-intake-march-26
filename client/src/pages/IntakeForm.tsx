import { useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import FormResponse from "@/components/FormResponse";
import axios from "axios";

// Form validation schema
const formSchema = z.object({
  // Section 1: Requesting Services For
  serviceRequestType: z.enum(["My Child", "Myself", "My Family", "My Partner & Myself"], {
    required_error: "Please select who you are requesting services for",
  }),
  formCompletedBy: z.string().min(1, "This field is required"),
  participantNames: z.array(z.string()).optional(),
  
  // Section 2: Patient Information
  fullName: z.string().min(1, "Full name is required"),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  genderAtBirth: z.enum(["Male", "Female", "Other"], {
    required_error: "Please select gender at birth",
  }),
  genderIdentity: z.string().optional(),
  street: z.string().min(1, "Street address is required"),
  apt: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "Valid zip code is required"),
  homePhone: z.string().optional(),
  mobilePhone: z.string().min(10, "Valid mobile phone is required"),
  email: z.string().email("Valid email is required"),
  consentToEmail: z.enum(["Yes", "No"], {
    required_error: "Please indicate if you consent to email",
  }),
  
  // Section 3: Insurance Information
  insuranceType: z.array(z.string()).min(1, "Select at least one insurance type"),
  primaryInsurance: z.string().optional(),
  primaryInsuranceID: z.string().optional(),
  primaryInsuredName: z.string().optional(),
  primaryInsuranceDOB: z.string().optional(),
  subscriberID: z.string().optional(),
  hasSecondaryInsurance: z.enum(["Yes", "No"]).optional(),
  secondaryInsurance: z.string().optional(),
  secondaryInsuranceID: z.string().optional(),
  secondaryInsuredName: z.string().optional(),
  secondaryInsuranceDOB: z.string().optional(),
  secondarySubscriberID: z.string().optional(),
  
  // Section 4: Clinical History
  underPhysicianCare: z.enum(["Yes", "No"], {
    required_error: "Please indicate if you are under a physician's care",
  }),
  physicianCareReason: z.string().optional(),
  physicianName: z.string().optional(),
  psychiatristName: z.string().optional(),
  hasPADDirective: z.enum(["Yes", "No", "Not Sure"], {
    required_error: "Please indicate if you have a PAD directive",
  }),
  understandPAD: z.enum(["Yes", "No", "Not Sure"]).optional(),
  wantPADInfo: z.enum(["Yes", "No"]).optional(),
  padDirectiveExplanation: z.string().optional(),
  medications: z.string().optional(),
  
  // Section 5: Reason for Referral
  reasonsForTherapy: z.array(z.string()).min(1, "Please select at least one reason for therapy"),
  otherReasonForTherapy: z.string().optional(),
  
  // Section 6: Motivational Interviewing
  therapyGoal: z.string().min(1, "Please provide your therapy goal"),
  motivationScales: z.object({
    importance: z.string().min(1, "Please rate how important it is for you to get help"),
    confidence: z.string().min(1, "Please rate your confidence in your ability to make changes"),
    readiness: z.string().min(1, "Please rate how ready you are to make these changes"),
  }),
  
  // Section 7: Prior Counseling
  priorCounseling: z.enum(["Yes", "No"], {
    required_error: "Please indicate if you've had prior counseling",
  }),
  counselingType: z.array(z.string()).optional(),
  priorCounselingWhen: z.string().optional(),
  priorCounselingWhere: z.string().optional(),
  priorCounselingByWhom: z.string().optional(),
  priorCounselingLength: z.string().optional(),
  priorCounselingOutcome: z.string().optional(),
  
  // Section 8: Signature
  initials: z.string().min(1, "Initials are required"),
  confirmAccuracy: z.boolean().refine(val => val === true, {
    message: "You must confirm the accuracy of the information",
  }),
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
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Section 1: Requesting Services For
      serviceRequestType: undefined,
      formCompletedBy: "",
      participantNames: [],
      
      // Section 2: Patient Information
      fullName: "",
      preferredName: "",
      dateOfBirth: "",
      genderAtBirth: undefined,
      genderIdentity: "",
      street: "",
      apt: "",
      city: "",
      state: "",
      zip: "",
      homePhone: "",
      mobilePhone: "",
      email: "",
      consentToEmail: undefined,
      
      // Section 3: Insurance Information
      insuranceType: [],
      primaryInsurance: "",
      primaryInsuranceID: "",
      primaryInsuredName: "",
      primaryInsuranceDOB: "",
      subscriberID: "",
      hasSecondaryInsurance: undefined,
      secondaryInsurance: "",
      secondaryInsuranceID: "",
      secondaryInsuredName: "",
      secondaryInsuranceDOB: "",
      secondarySubscriberID: "",
      
      // Section 4: Clinical History
      underPhysicianCare: undefined,
      physicianCareReason: "",
      physicianName: "",
      psychiatristName: "",
      hasPADDirective: undefined,
      understandPAD: undefined,
      wantPADInfo: undefined,
      padDirectiveExplanation: "",
      medications: "",
      
      // Section 5: Reason for Referral
      reasonsForTherapy: [],
      otherReasonForTherapy: "",
      
      // Section 6: Motivational Interviewing
      therapyGoal: "",
      motivationScales: {
        importance: "",
        confidence: "",
        readiness: "",
      },
      
      // Section 7: Prior Counseling
      priorCounseling: undefined,
      counselingType: [],
      priorCounselingWhen: "",
      priorCounselingWhere: "",
      priorCounselingByWhom: "",
      priorCounselingLength: "",
      priorCounselingOutcome: "",
      
      // Section 8: Signature
      initials: "",
      confirmAccuracy: false,
    },
  });

  const watchServiceRequestType = watch("serviceRequestType");
  const watchUnderPhysicianCare = watch("underPhysicianCare");
  const watchHasPADDirective = watch("hasPADDirective");
  const watchHasSecondaryInsurance = watch("hasSecondaryInsurance");
  const watchPriorCounseling = watch("priorCounseling");

  // Therapy reasons checkbox options
  const therapyReasons = [
    "Depression", "Anxiety", "Relationship Issues", "Grief/Loss", 
    "Trauma", "Stress", "Self-esteem", "Anger Management",
    "Family Conflict", "Life Transitions", "Career Challenges", "Addiction",
    "Eating Disorders", "OCD", "PTSD", "Bipolar Disorder",
    "Parenting Issues", "Communication Problems", "Sexual Problems",
    "Chronic Pain", "Identity Issues", "Suicidal Thoughts",
    "Sleep Problems", "Work Stress", "Financial Stress"
  ];

  // Insurance types
  const insuranceTypes = [
    "Private Pay", "Commercial Insurance", "Medicaid", "EAP"
  ];
  
  // Counseling types
  const counselingTypes = [
    "Inpatient", "Outpatient"
  ];

  const onSubmit = async (data: FormValues) => {
    try {
      await axios.post(
        "https://us-central1-phitest-api.cloudfunctions.net/forwardToMake",
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      setSubmissionStatus({
        status: "success",
        message: "Thank you! Your form has been submitted successfully.",
      });
      window.scrollTo(0, 0);
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
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:py-12">
        <Card className="shadow-md">
          <CardContent className="pt-6 pb-6">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">Request for Services</h1>
              <p className="text-gray-600">Please complete this form to request mental health services.</p>
            </div>

            {submissionStatus.status !== "idle" && (
              <FormResponse
                status={submissionStatus.status}
                message={submissionStatus.message}
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Section 1: Service Request Type */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">1. I am requesting services for:</h2>
                <Controller
                  control={control}
                  name="serviceRequestType"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6"
                    >
                      {["My Child", "Myself", "My Family", "My Partner & Myself"].map((option) => (
                        <div key={option} className="flex items-center">
                          <RadioGroupItem id={`service-${option}`} value={option} />
                          <Label htmlFor={`service-${option}`} className="ml-2">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.serviceRequestType && (
                  <p className="text-red-500 text-sm mt-1">{errors.serviceRequestType.message}</p>
                )}
              </div>

              <Separator />

              {/* Section 2: Form Completed By */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">2. Form Completed By:</h2>
                <FormField
                  id="formCompletedBy"
                  label="Full Name"
                  register={register}
                  error={errors.formCompletedBy}
                  required
                />
              </div>

              <Separator />

              {/* Section 3: Patient Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">3. Patient Information</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    id="fullName"
                    label="Full Name"
                    register={register}
                    error={errors.fullName}
                    required
                  />
                  <FormField
                    id="preferredName"
                    label="Preferred Name"
                    register={register}
                    error={errors.preferredName}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <FormField
                    id="dateOfBirth"
                    label="Date of Birth"
                    type="date"
                    register={register}
                    error={errors.dateOfBirth}
                    required
                  />
                  
                  <div className="sm:col-span-2">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender at Birth <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="genderAtBirth"
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-6"
                        >
                          {["Male", "Female", "Other"].map((option) => (
                            <div key={option} className="flex items-center">
                              <RadioGroupItem id={`gender-${option}`} value={option} />
                              <Label htmlFor={`gender-${option}`} className="ml-2">{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                    {errors.genderAtBirth && (
                      <p className="text-red-500 text-sm mt-1">{errors.genderAtBirth.message}</p>
                    )}
                  </div>
                </div>

                <FormField
                  id="genderIdentity"
                  label="Gender Identity (if different from above)"
                  register={register}
                  error={errors.genderIdentity}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    id="street"
                    label="Street Address"
                    register={register}
                    error={errors.street}
                    required
                  />
                  <FormField
                    id="apt"
                    label="Apt/Suite"
                    register={register}
                    error={errors.apt}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <FormField
                    id="city"
                    label="City"
                    register={register}
                    error={errors.city}
                    required
                  />
                  <FormField
                    id="state"
                    label="State"
                    register={register}
                    error={errors.state}
                    required
                  />
                  <FormField
                    id="zip"
                    label="Zip Code"
                    register={register}
                    error={errors.zip}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    id="homePhone"
                    label="Home Phone"
                    type="tel"
                    register={register}
                    error={errors.homePhone}
                  />
                  <FormField
                    id="mobilePhone"
                    label="Mobile Phone"
                    type="tel"
                    register={register}
                    error={errors.mobilePhone}
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

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Do you consent to receiving emails? <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="consentToEmail"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        {["Yes", "No"].map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem id={`email-consent-${option}`} value={option} />
                            <Label htmlFor={`email-consent-${option}`} className="ml-2">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                  {errors.consentToEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.consentToEmail.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section 4-6: Insurance Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">4. Insurance Information</h2>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Type (select all that apply) <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {insuranceTypes.map((type) => (
                      <div key={type} className="flex items-center">
                        <Controller
                          control={control}
                          name="insuranceType"
                          render={({ field }) => (
                            <Checkbox
                              id={`insurance-${type}`}
                              checked={field.value?.includes(type)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, type]);
                                } else {
                                  field.onChange(field.value?.filter((value) => value !== type));
                                }
                              }}
                            />
                          )}
                        />
                        <Label htmlFor={`insurance-${type}`} className="ml-2">{type}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.insuranceType && (
                    <p className="text-red-500 text-sm mt-1">{errors.insuranceType.message}</p>
                  )}
                </div>

                <h3 className="text-lg font-medium text-gray-700">5. Primary Insurance</h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <FormField
                    id="primaryInsurance"
                    label="Primary Insurance Provider"
                    register={register}
                    error={errors.primaryInsurance}
                  />
                  <FormField
                    id="primaryInsuranceID"
                    label="ID Number"
                    register={register}
                    error={errors.primaryInsuranceID}
                  />
                  <FormField
                    id="primaryInsuranceDOB"
                    label="Insured's DOB"
                    type="date"
                    register={register}
                    error={errors.primaryInsuranceDOB}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Do you have secondary insurance?
                  </Label>
                  <Controller
                    control={control}
                    name="hasSecondaryInsurance"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        {["Yes", "No"].map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem id={`secondary-insurance-${option}`} value={option} />
                            <Label htmlFor={`secondary-insurance-${option}`} className="ml-2">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                </div>

                {watchHasSecondaryInsurance === "Yes" && (
                  <>
                    <h3 className="text-lg font-medium text-gray-700">6. Secondary Insurance</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <FormField
                        id="secondaryInsurance"
                        label="Secondary Insurance Provider"
                        register={register}
                        error={errors.secondaryInsurance}
                      />
                      <FormField
                        id="secondaryInsuranceID"
                        label="ID Number"
                        register={register}
                        error={errors.secondaryInsuranceID}
                      />
                      <FormField
                        id="secondaryInsuranceDOB"
                        label="Insured's DOB"
                        type="date"
                        register={register}
                        error={errors.secondaryInsuranceDOB}
                      />
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Section 7-10: Medical History */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">7. Medical Information</h2>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Are you currently under the care of a physician? <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="underPhysicianCare"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        {["Yes", "No"].map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem id={`physician-care-${option}`} value={option} />
                            <Label htmlFor={`physician-care-${option}`} className="ml-2">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                  {errors.underPhysicianCare && (
                    <p className="text-red-500 text-sm mt-1">{errors.underPhysicianCare.message}</p>
                  )}
                </div>

                {watchUnderPhysicianCare === "Yes" && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      id="physicianName"
                      label="Physician's Name"
                      register={register}
                      error={errors.physicianName}
                    />
                    <FormField
                      id="physicianCareReason"
                      label="For what condition or issue?"
                      register={register}
                      error={errors.physicianCareReason}
                    />
                  </div>
                )}

                <h3 className="text-lg font-medium text-gray-700">8. PAD Directive</h3>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Do you have a Psychiatric Advance Directive (PAD)? <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="hasPADDirective"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        {["Yes", "No", "Not Sure"].map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem id={`pad-${option}`} value={option} />
                            <Label htmlFor={`pad-${option}`} className="ml-2">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                  {errors.hasPADDirective && (
                    <p className="text-red-500 text-sm mt-1">{errors.hasPADDirective.message}</p>
                  )}
                </div>

                {watchHasPADDirective === "Yes" && (
                  <FormField
                    id="padDirectiveExplanation"
                    label="Please explain"
                    register={register}
                    error={errors.padDirectiveExplanation}
                    multiline
                    rows={2}
                  />
                )}

                <h3 className="text-lg font-medium text-gray-700">9. Current Medications</h3>
                
                <FormField
                  id="medications"
                  label="Current Medications (name/dosage/frequency/reason)"
                  register={register}
                  error={errors.medications}
                  multiline
                  rows={4}
                />

                <h3 className="text-lg font-medium text-gray-700">10. Reasons for Seeking Therapy</h3>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-3">
                    Select all that apply <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {therapyReasons.map((reason) => (
                      <div key={reason} className="flex items-center">
                        <Controller
                          control={control}
                          name="reasonsForTherapy"
                          render={({ field }) => (
                            <Checkbox
                              id={`reason-${reason}`}
                              checked={field.value?.includes(reason)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, reason]);
                                } else {
                                  field.onChange(field.value?.filter((value) => value !== reason));
                                }
                              }}
                            />
                          )}
                        />
                        <Label htmlFor={`reason-${reason}`} className="ml-2">{reason}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.reasonsForTherapy && (
                    <p className="text-red-500 text-sm mt-1">{errors.reasonsForTherapy.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section 11-13: Readiness and Past Counseling */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">11. Therapy Goals</h2>
                
                <FormField
                  id="therapyGoal"
                  label="Please summarize what you hope to accomplish with therapy"
                  register={register}
                  error={errors.therapyGoal}
                  multiline
                  rows={4}
                  required
                />

                <h3 className="text-lg font-medium text-gray-700">12. Motivational Scales</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Please rate the following on a scale from 1 to 10 (1 = Low, 10 = High)
                </p>

                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      How important is it for you to get help right now? <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="motivationScales.importance"
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-1 sm:space-x-2"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <div key={num} className="flex flex-col items-center">
                              <RadioGroupItem id={`importance-${num}`} value={num.toString()} />
                              <Label htmlFor={`importance-${num}`} className="text-xs mt-1">{num}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      How confident are you in your ability to make changes? <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="motivationScales.confidence"
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-1 sm:space-x-2"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <div key={num} className="flex flex-col items-center">
                              <RadioGroupItem id={`confidence-${num}`} value={num.toString()} />
                              <Label htmlFor={`confidence-${num}`} className="text-xs mt-1">{num}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      How ready are you to make these changes? <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="motivationScales.readiness"
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-1 sm:space-x-2"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <div key={num} className="flex flex-col items-center">
                              <RadioGroupItem id={`readiness-${num}`} value={num.toString()} />
                              <Label htmlFor={`readiness-${num}`} className="text-xs mt-1">{num}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-700">13. Prior Counseling</h3>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Have you had counseling before? <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="priorCounseling"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        {["Yes", "No"].map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem id={`prior-counseling-${option}`} value={option} />
                            <Label htmlFor={`prior-counseling-${option}`} className="ml-2">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                  {errors.priorCounseling && (
                    <p className="text-red-500 text-sm mt-1">{errors.priorCounseling.message}</p>
                  )}
                </div>

                {watchPriorCounseling === "Yes" && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <FormField
                      id="priorCounselingByWhom"
                      label="Who did you see?"
                      register={register}
                      error={errors.priorCounselingByWhom}
                    />
                    <FormField
                      id="priorCounselingWhere"
                      label="Where?"
                      register={register}
                      error={errors.priorCounselingWhere}
                    />
                    <FormField
                      id="priorCounselingOutcome"
                      label="Outcome"
                      register={register}
                      error={errors.priorCounselingOutcome}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 14: Signature */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">14. Signature</h2>
                
                <FormField
                  id="initials"
                  label="Digital Signature (Type your initials)"
                  register={register}
                  error={errors.initials}
                  required
                />
                
                <div className="mt-4">
                  <Controller
                    control={control}
                    name="confirmAccuracy"
                    render={({ field }) => (
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <Checkbox
                            id="confirmAccuracy"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <Label htmlFor="confirmAccuracy" className="text-gray-700">
                            I confirm that the information submitted is accurate and complete to the best of my knowledge.
                          </Label>
                        </div>
                      </div>
                    )}
                  />
                  {errors.confirmAccuracy && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmAccuracy.message}</p>
                  )}
                </div>
              </div>

              <SubmitButton isSubmitting={isSubmitting} />
            </form>

            {submissionStatus.status !== "idle" && (
              <div className="mt-6">
                <FormResponse
                  status={submissionStatus.status}
                  message={submissionStatus.message}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
