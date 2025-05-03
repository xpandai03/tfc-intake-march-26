import { useState } from "react";
import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
  participantNames: z.array(z.object({ 
    name: z.string().min(1, "Participant name is required"),
    dob: z.string().min(1, "Participant date of birth is required")
  })).optional(),
  custodyType: z.enum(["Sole Custody", "Joint Custody", "CYFD Custody", "Other"]).optional(),
  
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
  
  // Primary Insurance
  primaryInsurance: z.string().optional(),
  primaryInsuranceID: z.string().optional(),
  subscriberRelation: z.enum(["Self", "Parent", "Child", "Partner"]).optional(),
  primarySubscriberName: z.string().optional(),
  primarySubscriberDOB: z.string().optional(),
  subscriberID: z.string().optional(),
  
  // Secondary Insurance
  hasSecondaryInsurance: z.enum(["Yes", "No"]).optional(),
  secondaryInsurance: z.string().optional(),
  secondaryInsuranceID: z.string().optional(),
  secondarySubscriberRelation: z.enum(["Self", "Parent", "Child", "Partner"]).optional(),
  secondarySubscriberName: z.string().optional(),
  secondarySubscriberDOB: z.string().optional(),
  secondarySubscriberID: z.string().optional(),
  
  // Desired Modality
  desiredModality: z.enum(["In Person", "Telehealth", "Hybrid"], {
    required_error: "Please select a desired modality",
  }),
  
  // Reasons for Seeking Services
  reasonsForTherapy: z.array(z.string()).min(1, "Please select at least one reason for therapy"),
  reasonForSeeking: z.string().min(1, "Please explain why you are seeking services"),
  reasonForSeekingServices: z.string().min(1, "Please explain why you are seeking services"),
  
  // Prior Counseling
  priorCounseling: z.enum(["Yes", "No"], {
    required_error: "Please indicate if you've had prior counseling",
  }),
  priorCounselingDetails: z.string().optional(),
  
  // Signature
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
      custodyType: undefined,
      
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
      subscriberRelation: undefined,
      primarySubscriberName: "",
      primarySubscriberDOB: "",
      subscriberID: "",
      hasSecondaryInsurance: undefined,
      secondaryInsurance: "",
      secondaryInsuranceID: "",
      secondarySubscriberRelation: undefined,
      secondarySubscriberName: "",
      secondarySubscriberDOB: "",
      secondarySubscriberID: "",
      
      // Desired Modality
      desiredModality: undefined,
      
      // Reasons for Seeking Services
      reasonsForTherapy: [],
      reasonForSeeking: "",
      reasonForSeekingServices: "",
      
      // Prior Counseling
      priorCounseling: undefined,
      priorCounselingDetails: "",
      
      // Signature
      initials: "",
      confirmAccuracy: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participantNames",
  });
  
  // Watch for form field changes
  const watchServiceRequestType = watch("serviceRequestType" as const);
  const watchHasSecondaryInsurance = watch("hasSecondaryInsurance" as const);
  const watchPriorCounseling = watch("priorCounseling" as const);
  const watchSubscriberRelation = watch("subscriberRelation" as const);
  const watchSecondarySubscriberRelation = watch("secondarySubscriberRelation" as const);

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
      console.log("Submitting data:", data); // Temporary log for debugging
      
      await axios.post(
        "https://prod-187.westus.logic.azure.com:443/workflows/783efb077f0041b59cfa677b1dedcac3/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vx5yn2DfZ731OFDWTdPlOPNmDv0qaXRpnyJheORXx48",
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Set success feedback
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
              <div style={{textAlign: 'center', padding: '1rem 2rem'}}>
                <img 
                  src="https://media-hosting.imagekit.io/6cb73841e2af44a9/family-connection-logo.png?Expires=1838827813&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=vH1rgLH2MPTs1rUMOAgpfbygbFFZ1LoNAtOV8lPSsB1g0KuciqTCg3ZSUFHeQQM2pskuPn8uwR2xJzQ1Xo-hhvYUUgvsjRj-F1W6kMMmAi~N8LRkCPplp9IU80vjXN1WTX6sj3UakwP16tHZeF79S8VUdZXIaG9W8vJi3D9ruUiLhgdpV-~TVtYPHwu3cZpjO4obTylGaOSULUQm7WbnDHC~16nnoV92letBvx7fBzROvTQ3HmdAaoVrPCJeZjk~4X5FuuAzQXuRpRgGRc3ElN7xGFNy8trDduMvTUKHihax0d1x6IOn1iVc6fzLAoVVFphEfodiJqAokyXZYuZwAA__" 
                  alt="Family Connection Clinic Logo" 
                  style={{display: 'block', margin: '0 auto', maxWidth: '280px', width: '100%', height: 'auto'}}
                />
              </div>
              <p className="text-gray-600 text-center mt-4">Please complete this form to request mental health services.</p>
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
                
                {watchServiceRequestType === "My Child" && (
                  <div className="mt-4">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Custody Type
                    </Label>
                    <Controller
                      control={control}
                      name="custodyType"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select custody type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sole Custody">Sole Custody</SelectItem>
                            <SelectItem value="Joint Custody">Joint Custody</SelectItem>
                            <SelectItem value="CYFD Custody">CYFD Custody</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.custodyType && (
                      <p className="text-red-500 text-sm mt-1">{errors.custodyType.message}</p>
                    )}
                  </div>
                )}

                {(watchServiceRequestType === "My Family" || watchServiceRequestType === "My Partner & Myself") && (
                  <div className="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      Please list all participants:
                    </h3>
                    
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                          <div className="sm:col-span-5">
                            <FormField
                              id={`participantNames.${index}.name`}
                              label={`Participant ${index + 1}`}
                              register={register}
                              error={errors.participantNames?.[index]?.name}
                              required
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <FormField
                              id={`participantNames.${index}.dob`}
                              label="Date of Birth"
                              type="date"
                              register={register}
                              error={errors.participantNames?.[index]?.dob}
                              required
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-end">
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mb-1 w-full"
                              onClick={() => remove(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ name: "", dob: "" })}
                        className="mt-2"
                      >
                        Add Participant
                      </Button>
                    </div>
                  </div>
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

              {/* Desired Modality */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">Desired Modality</h2>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Please select your desired modality <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="desiredModality"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select modality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Person">In Person</SelectItem>
                          <SelectItem value="Telehealth">Telehealth</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.desiredModality && (
                    <p className="text-red-500 text-sm mt-1">{errors.desiredModality.message}</p>
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
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Subscriber is:
                    </Label>
                    <Controller
                      control={control}
                      name="subscriberRelation"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Self">Self</SelectItem>
                            <SelectItem value="Parent">Parent</SelectItem>
                            <SelectItem value="Child">Child</SelectItem>
                            <SelectItem value="Partner">Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.subscriberRelation && (
                      <p className="text-red-500 text-sm mt-1">{errors.subscriberRelation.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-4">
                  {watchSubscriberRelation && watchSubscriberRelation !== "Self" ? (
                    <>
                      <FormField
                        id="primarySubscriberName"
                        label="Subscriber's Name"
                        register={register}
                        error={errors.primarySubscriberName}
                        required
                      />
                      <FormField
                        id="primarySubscriberDOB"
                        label="Subscriber's Date of Birth"
                        type="date"
                        register={register}
                        error={errors.primarySubscriberDOB}
                        required
                      />
                    </>
                  ) : null}
                  <FormField
                    id="subscriberID"
                    label="Subscriber ID"
                    register={register}
                    error={errors.subscriberID}
                    required
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
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                          Subscriber is:
                        </Label>
                        <Controller
                          control={control}
                          name="secondarySubscriberRelation"
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Self">Self</SelectItem>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Child">Child</SelectItem>
                                <SelectItem value="Partner">Partner</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.secondarySubscriberRelation && (
                          <p className="text-red-500 text-sm mt-1">{errors.secondarySubscriberRelation.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-4">
                      {watchSecondarySubscriberRelation && watchSecondarySubscriberRelation !== "Self" ? (
                        <>
                          <FormField
                            id="secondarySubscriberName"
                            label="Subscriber's Name"
                            register={register}
                            error={errors.secondarySubscriberName}
                            required
                          />
                          <FormField
                            id="secondarySubscriberDOB"
                            label="Subscriber's Date of Birth"
                            type="date"
                            register={register}
                            error={errors.secondarySubscriberDOB}
                            required
                          />
                        </>
                      ) : null}
                      <FormField
                        id="secondarySubscriberID"
                        label="Subscriber ID"
                        register={register}
                        error={errors.secondarySubscriberID}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Section 7: Reasons for Seeking Therapy */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">7. Reasons for Seeking Therapy</h2>
                
                <FormField
                  id="reasonForSeekingServices"
                  label="Why are you seeking services?"
                  register={register}
                  error={errors.reasonForSeekingServices}
                  multiline
                  rows={4}
                  required
                />
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-3">
                    Select all that apply <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {therapyReasons.map((reason) => (
                      <div key={reason} className="flex items-center bg-gray-50 p-2 rounded-md">
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
                        <Label htmlFor={`reason-${reason}`} className="ml-2 text-gray-700">{reason}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.reasonsForTherapy && (
                    <p className="text-red-500 text-sm mt-1">{errors.reasonsForTherapy.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section 8: Prior Counseling */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">8. Prior Counseling</h2>
                
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
                  <div className="mt-4">
                    <FormField
                      id="priorCounselingDetails"
                      label="When and with whom? (Please provide details)"
                      register={register}
                      error={errors.priorCounselingDetails}
                      multiline={true}
                      rows={3}
                      required={watchPriorCounseling === "Yes"}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 9: Signature */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">9. Signature</h2>
                
                <div className="border border-gray-200 bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 mb-4">
                    By typing my initials below and checking the confirmation box, I acknowledge that I understand this 
                    is a request for services. Submitting this form does not guarantee services, and I understand that 
                    someone will contact me to discuss next steps. I confirm that the information I have provided is 
                    accurate and complete to the best of my knowledge.
                  </p>
                  
                  <FormField
                    id="initials"
                    label="Digital Signature (Type your initials) *"
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
                              I confirm that the information submitted is accurate and complete to the best of my knowledge. <span className="text-red-500">*</span>
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
