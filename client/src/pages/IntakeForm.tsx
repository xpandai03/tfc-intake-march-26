import { useEffect, useState } from "react";
import moment from "moment-timezone";

import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import tfcLogoPath from "@assets/TFC Logo color (3)_1754422698445.jpg";
import { getTranslations, type Language } from "@/lib/translations";

const getDateString = () => {
  try {
    const date = new Date();

    const formattedDate = date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    var tzName = moment.tz.guess();
    var abbr = moment.tz(tzName).zoneAbbr();
    console.log(abbr);
    return `${formattedDate} - ${abbr}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};
// Form validation schema
const formSchema = z.object({
  // Section 1: Requesting Services For
  serviceRequestType: z.enum(
    ["My Child", "Myself", "My Family", "My Partner & Myself"],
    {
      required_error: "Please select who you are requesting services for",
    },
  ),
  formCompletedBy: z.string().min(1, "This field is required"),
  participantNames: z
    .array(
      z.object({
        name: z.string().min(1, "Participant name is required"),
        dob: z.string().min(1, "Participant date of birth is required"),
        email: z.string().email("Please enter a valid email").optional(),
        phoneNumber: z.string().optional(),
      }),
    )
    .optional(),
  custodyType: z
    .enum(["Sole Custody", "Joint Custody", "CYFD Custody", "Other"])
    .optional(),

  // Section 2: Patient Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  sex: z.enum(["Male", "Female", "Other"], {
    required_error: "Please select sex",
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
  insuranceType: z
    .array(z.string())
    .min(1, "Select at least one insurance type"),

  // Primary Insurance
  primaryInsurance: z.string().min(1, "Please select a primary insurance provider"),
  primaryInsuranceOther: z.string().optional(),
  primaryInsuranceID: z.string().optional(),
  subscriberRelation: z.enum(["Self", "Parent", "Child", "Partner"]).optional(),
  primarySubscriberName: z.string().optional(),
  primarySubscriberDOB: z.string().optional(),
  subscriberID: z.string().optional(),

  // Secondary Insurance
  hasSecondaryInsurance: z.enum(["Yes", "No"]).optional(),
  secondaryInsurance: z.string().optional(),
  secondaryInsuranceID: z.string().optional(),
  secondarySubscriberRelation: z
    .enum(["Self", "Parent", "Child", "Partner"])
    .optional(),
  secondarySubscriberName: z.string().optional(),
  secondarySubscriberDOB: z.string().optional(),
  secondarySubscriberID: z.string().optional(),

  // Desired Modality
  desiredModality: z.enum(["In Person - Albuquerque", "In Person - Rio Rancho", "In Person - Los Lunas", "In Person - Albuquerque or Rio Rancho", "Telehealth", "Hybrid", "Flexible (Open to Any Option)"], {
    required_error: "Please select a desired modality",
  }),

  // Reasons for Seeking Services
  reasonsForTherapy: z
    .array(z.string())
    .min(1, "Please select at least one reason for therapy"),
  reasonForSeekingServices: z
    .string()
    .min(1, "Please explain why you are seeking services"),

  // Prior Counseling
  priorCounseling: z.enum(["Yes", "No"], {
    required_error: "Please indicate if you've had prior counseling",
  }),
  priorCounselingDetails: z.string().optional(),
  whoTheySawBefore: z.string().optional(),
  wasAtTFC: z.boolean().optional(),
  providerRequested: z.string().optional(),
  priorOutcome: z
    .enum([
      "Successful",
      "Somewhat helpful",
      "Not helpful",
      "Incomplete",
      "Other",
    ])
    .optional(),

  // Signature
  initials: z.string().min(1, "Initials are required"),
  confirmAccuracy: z.boolean().refine((val) => val === true, {
    message: "You must confirm the accuracy of the information",
  }),
}).refine((data) => {
  // If "Other (please specify)" is selected, primaryInsuranceOther is required
  if (data.primaryInsurance === "Other (please specify)") {
    return data.primaryInsuranceOther && data.primaryInsuranceOther.trim().length > 0;
  }
  return true;
}, {
  message: "Please specify your insurance provider",
  path: ["primaryInsuranceOther"],
});

type FormValues = z.infer<typeof formSchema>;

export default function IntakeForm() {
  const [language, setLanguage] = useState<Language>("en");
  const t = getTranslations(language);
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
      firstName: "",
      lastName: "",
      preferredName: "",
      dateOfBirth: "",
      sex: undefined,
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
      primaryInsuranceOther: "",
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
      reasonForSeekingServices: "",

      // Prior Counseling
      priorCounseling: undefined,
      priorCounselingDetails: "",
      whoTheySawBefore: "",
      wasAtTFC: false,
      providerRequested: "",
      priorOutcome: undefined,

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
  const watchSecondarySubscriberRelation = watch(
    "secondarySubscriberRelation" as const,
  );
  const watchWasAtTFC = watch("wasAtTFC" as const);
  const watchPrimaryInsurance = watch("primaryInsurance" as const);

  // Therapy reasons checkbox options
  const therapyReasons = [
    "Depression",
    "Anxiety",
    "Relationship Issues",
    "Grief/Loss",
    "Trauma",
    "Stress",
    "Self-esteem",
    "Anger Management",
    "Family Conflict",
    "Life Transitions",
    "Career Challenges",
    "Addiction",
    "Eating Disorders",
    "OCD",
    "PTSD",
    "Bipolar Disorder",
    "Parenting Issues",
    "Communication Problems",
    "Sexual Problems",
    "Chronic Pain",
    "Identity Issues",
    "Suicidal Thoughts",
    "Sleep Problems",
    "Work Stress",
    "Financial Stress",
  ];

  // Insurance types
  const insuranceTypes = [
    "Commercial Insurance",
    "Medicaid",
    "Medicare",
    "EAP",
    "Self-Pay (Cash / Out-of-Pocket)",
  ];

  // Primary insurance provider options
  const primaryInsuranceOptions = [
    "VACCN (VA Community Care)",
    "Tricare",
    "Presbyterian Commercial",
    "Presbyterian Turquoise Care",
    "BlueCross BlueShield Commercial",
    "BlueCross BlueShield Turquoise Care",
    "United Healthcare",
    "Aetna",
    "UMR",
    "Molina",
    "Medicare",
    "Medicaid",
    "ComPsych",
    "Self-Pay (Cash / Out-of-Pocket)",
    "EAP",
    "Other (please specify)",
  ];

  // Counseling types
  const counselingTypes = ["Inpatient", "Outpatient"];

  const onSubmit = async (data: FormValues) => {
    try {
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
      const phone = data.mobilePhone || data.homePhone || "";

      const noteLines = [
        `Service Request: ${data.serviceRequestType || "N/A"}`,
        `Form Completed By: ${data.formCompletedBy || "N/A"}`,
        `Preferred Name: ${data.preferredName || "N/A"}`,
        `DOB: ${data.dateOfBirth || "N/A"}`,
        `Sex: ${data.sex || "N/A"}`,
        `Gender Identity: ${data.genderIdentity || "N/A"}`,
        `Address: ${[data.street, data.apt, data.city, data.state, data.zip].filter(Boolean).join(", ")}`,
        `Custody Type: ${data.custodyType || "N/A"}`,
        `Insurance: ${data.insuranceType || "N/A"} — ${data.primaryInsurance || "N/A"} (ID: ${data.primaryInsuranceID || "N/A"})`,
        `Desired Modality: ${data.desiredModality || "N/A"}`,
        `Reasons for Therapy: ${data.reasonsForTherapy || "N/A"}`,
        `Reason for Seeking Services: ${data.reasonForSeekingServices || "N/A"}`,
        `Prior Counseling: ${data.priorCounseling || "N/A"}${data.priorCounselingDetails ? ` — ${data.priorCounselingDetails}` : ""}`,
        `Provider Requested: ${data.providerRequested || "N/A"}`,
        `Submitted At: ${getDateString()}`,
      ];

      if (data.participantNames?.length) {
        noteLines.push(
          `Participants: ${data.participantNames.map((p) => p.name).filter(Boolean).join(", ")}`,
        );
      }

      const payload = {
        name: fullName,
        email: data.email || "",
        phone,
        notes: noteLines.join("\n"),
      };

      await axios.post(
        "https://tfc-crm-2-0.fly.dev/api/intake",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setSubmissionStatus({
        status: "success",
        message: t.successMessage,
      });
      window.scrollTo(0, 0);
      reset();
    } catch (error) {
      let errorMessage = t.errorMessage;

      if (axios.isAxiosError(error)) {
        console.error("Submission error:", {
          status: error.response?.status,
          data: error.response?.data,
        });

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
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
      <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:py-6">
        <Card className="shadow-md">
          <CardContent className="pt-6 pb-6">
            <div className="mb-8">
              <div className="text-center py-4 px-4">
                <img
                  src={tfcLogoPath}
                  alt="The Family Connection - Changing Mental Health"
                  className="mx-auto block w-full h-auto max-w-sm sm:max-w-md md:max-w-lg"
                  style={{
                    maxWidth: "350px",
                    minHeight: "60px",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    console.error("Logo failed to load:", e);
                    e.currentTarget.style.display = "none";
                  }}
                  onLoad={() => console.log("Logo loaded successfully")}
                />
              </div>
              <p className="text-gray-600 text-center mt-4">
                {t.formSubtitle}
              </p>
            </div>

            {submissionStatus.status !== "idle" && (
              <FormResponse
                status={submissionStatus.status}
                message={submissionStatus.message}
              />
            )}

            <form
              onSubmit={(e) => {
                console.log("Form onSubmit event triggered");
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-8"
            >
              {/* Language Toggle */}
              <div className="flex items-center justify-center gap-3 pb-2">
                <span className="text-sm font-medium text-gray-600">English</span>
                <Switch
                  checked={language === "es"}
                  onCheckedChange={(checked) => setLanguage(checked ? "es" : "en")}
                />
                <span className="text-sm font-medium text-gray-600">Español</span>
              </div>

              {/* Section 1: Service Request Type */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">
                  {t.section1Title}
                </h2>
                <Controller
                  control={control}
                  name="serviceRequestType"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6"
                    >
                      {(["My Child", "Myself", "My Family", "My Partner & Myself"] as const).map((option) => (
                        <div key={option} className="flex items-center">
                          <RadioGroupItem
                            id={`service-${option}`}
                            value={option}
                          />
                          <Label htmlFor={`service-${option}`} className="ml-2">
                            {t.serviceOptions[option]}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.serviceRequestType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.serviceRequestType.message}
                  </p>
                )}

                {watchServiceRequestType === "My Child" && (
                  <div className="mt-4">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.custodyTypeLabel}
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
                            <SelectValue placeholder={t.custodyPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {(["Sole Custody", "Joint Custody", "CYFD Custody", "Other"] as const).map((opt) => (
                              <SelectItem key={opt} value={opt}>{t.custodyOptions[opt]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.custodyType && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.custodyType.message}
                      </p>
                    )}
                  </div>
                )}

                {(watchServiceRequestType === "My Family" ||
                  watchServiceRequestType === "My Partner & Myself") && (
                  <div className="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      {t.participantsTitle}
                    </h3>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="border border-gray-200 rounded-md p-4 mb-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                            <div className="sm:col-span-6">
                              <FormField
                                id={`participantNames.${index}.name`}
                                label={`${t.participantLabel} ${index + 1}`}
                                register={register}
                                error={errors.participantNames?.[index]?.name}
                                required
                              />
                            </div>
                            <div className="sm:col-span-6">
                              <FormField
                                id={`participantNames.${index}.dob`}
                                label={t.participantDOB}
                                type="date"
                                register={register}
                                error={errors.participantNames?.[index]?.dob}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                            <div className="sm:col-span-6">
                              <FormField
                                id={`participantNames.${index}.email`}
                                label={t.participantEmail}
                                type="email"
                                register={register}
                                error={errors.participantNames?.[index]?.email}
                              />
                            </div>
                            <div className="sm:col-span-6">
                              <FormField
                                id={`participantNames.${index}.phoneNumber`}
                                label={t.participantPhone}
                                type="tel"
                                register={register}
                                error={
                                  errors.participantNames?.[index]?.phoneNumber
                                }
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-600"
                            >
                              {t.removeParticipant}
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          append({
                            name: "",
                            dob: "",
                            email: "",
                            phoneNumber: "",
                          })
                        }
                        className="mt-2"
                      >
                        {t.addParticipant}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 2: Form Completed By */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">
                  {t.section2Title}
                </h2>
                <FormField
                  id="formCompletedBy"
                  label={t.fullNameLabel}
                  register={register}
                  error={errors.formCompletedBy}
                  required
                />
              </div>

              <Separator />

              {/* Section 3: Patient Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">
                  {t.section3Title}
                </h2>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    id="firstName"
                    label={t.firstName}
                    register={register}
                    error={errors.firstName}
                    required
                  />
                  <FormField
                    id="lastName"
                    label={t.lastName}
                    register={register}
                    error={errors.lastName}
                    required
                  />
                </div>

                <FormField
                  id="preferredName"
                  label={t.preferredName}
                  register={register}
                  error={errors.preferredName}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <FormField
                    id="dateOfBirth"
                    label={t.dateOfBirth}
                    type="date"
                    register={register}
                    error={errors.dateOfBirth}
                    required
                  />

                  <div className="sm:col-span-2">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.sexLabel} <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="sex"
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-6"
                        >
                          {(["Male", "Female", "Other"] as const).map((option) => (
                            <div key={option} className="flex items-center">
                              <RadioGroupItem
                                id={`sex-${option}`}
                                value={option}
                              />
                              <Label htmlFor={`sex-${option}`} className="ml-2">
                                {t.sexOptions[option]}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                    {errors.sex && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.sex.message}
                      </p>
                    )}
                  </div>
                </div>

                <FormField
                  id="genderIdentity"
                  label={t.genderIdentity}
                  register={register}
                  error={errors.genderIdentity}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    id="street"
                    label={t.streetAddress}
                    register={register}
                    error={errors.street}
                    required
                  />
                  <FormField
                    id="apt"
                    label={t.aptSuite}
                    register={register}
                    error={errors.apt}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <FormField
                    id="city"
                    label={t.city}
                    register={register}
                    error={errors.city}
                    required
                  />
                  <FormField
                    id="state"
                    label={t.state}
                    register={register}
                    error={errors.state}
                    required
                  />
                  <FormField
                    id="zip"
                    label={t.zipCode}
                    register={register}
                    error={errors.zip}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    id="homePhone"
                    label={t.homePhone}
                    type="tel"
                    register={register}
                    error={errors.homePhone}
                  />
                  <FormField
                    id="mobilePhone"
                    label={t.mobilePhone}
                    type="tel"
                    register={register}
                    error={errors.mobilePhone}
                    required
                  />
                </div>

                <FormField
                  id="email"
                  label={t.emailLabel}
                  type="email"
                  register={register}
                  error={errors.email}
                  required
                />

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.consentToEmail}{" "}
                    <span className="text-red-500">*</span>
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
                        {(["Yes", "No"] as const).map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem
                              id={`email-consent-${option}`}
                              value={option}
                            />
                            <Label
                              htmlFor={`email-consent-${option}`}
                              className="ml-2"
                            >
                              {option === "Yes" ? t.yes : t.no}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                  {errors.consentToEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.consentToEmail.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Desired Modality */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">
                  {t.desiredModalityTitle}
                </h2>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.desiredModalityLabel}{" "}
                    <span className="text-red-500">*</span>
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
                          <SelectValue placeholder={t.desiredModalityPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {(["In Person - Albuquerque", "In Person - Rio Rancho", "In Person - Los Lunas", "In Person - Albuquerque or Rio Rancho", "Telehealth", "Hybrid", "Flexible (Open to Any Option)"] as const).map((opt) => (
                            <SelectItem key={opt} value={opt}>{t.modalityOptions[opt]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.desiredModality && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.desiredModality.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section 4-6: Insurance Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">
                  {t.section4Title}
                </h2>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.insuranceTypeLabel}{" "}
                    <span className="text-red-500">*</span>
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
                                  field.onChange(
                                    field.value?.filter(
                                      (value) => value !== type,
                                    ),
                                  );
                                }
                              }}
                            />
                          )}
                        />
                        <Label htmlFor={`insurance-${type}`} className="ml-2">
                          {t.insuranceTypes[type as keyof typeof t.insuranceTypes] || type}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.insuranceType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.insuranceType.message}
                    </p>
                  )}
                </div>

                <h3 className="text-lg font-medium text-gray-700">
                  {t.section5Title}
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.primaryInsuranceLabel} <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="primaryInsurance"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t.primaryInsurancePlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {primaryInsuranceOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t.primaryInsuranceOptions[option as keyof typeof t.primaryInsuranceOptions] || option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.primaryInsurance && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.primaryInsurance.message}
                      </p>
                    )}
                  </div>
                  <FormField
                    id="primaryInsuranceID"
                    label={t.idNumber}
                    register={register}
                    error={errors.primaryInsuranceID}
                  />
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.subscriberIs}
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
                            <SelectValue placeholder={t.subscriberPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {(["Self", "Parent", "Child", "Partner"] as const).map((opt) => (
                              <SelectItem key={opt} value={opt}>{t.subscriberOptions[opt]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.subscriberRelation && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.subscriberRelation.message}
                      </p>
                    )}
                  </div>
                </div>

                {watchPrimaryInsurance === "Other (please specify)" && (
                  <div className="mt-4">
                    <FormField
                      id="primaryInsuranceOther"
                      label={t.specifyInsurance}
                      register={register}
                      error={errors.primaryInsuranceOther}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-4">
                  {watchSubscriberRelation &&
                  watchSubscriberRelation !== "Self" ? (
                    <>
                      <FormField
                        id="primarySubscriberName"
                        label={t.subscriberName}
                        register={register}
                        error={errors.primarySubscriberName}
                        required
                      />
                      <FormField
                        id="primarySubscriberDOB"
                        label={t.subscriberDOB}
                        type="date"
                        register={register}
                        error={errors.primarySubscriberDOB}
                        required
                      />
                    </>
                  ) : null}
                  <FormField
                    id="subscriberID"
                    label={t.subscriberID}
                    register={register}
                    error={errors.subscriberID}
                    required
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.secondaryInsuranceQuestion}
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
                        {(["Yes", "No"] as const).map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem
                              id={`secondary-insurance-${option}`}
                              value={option}
                            />
                            <Label
                              htmlFor={`secondary-insurance-${option}`}
                              className="ml-2"
                            >
                              {option === "Yes" ? t.yes : t.no}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                </div>

                {watchHasSecondaryInsurance === "Yes" && (
                  <>
                    <h3 className="text-lg font-medium text-gray-700">
                      {t.section6Title}
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <FormField
                        id="secondaryInsurance"
                        label={t.secondaryInsuranceLabel}
                        register={register}
                        error={errors.secondaryInsurance}
                      />
                      <FormField
                        id="secondaryInsuranceID"
                        label={t.idNumber}
                        register={register}
                        error={errors.secondaryInsuranceID}
                      />
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.subscriberIs}
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
                                <SelectValue placeholder={t.subscriberPlaceholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {(["Self", "Parent", "Child", "Partner"] as const).map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t.subscriberOptions[opt]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.secondarySubscriberRelation && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.secondarySubscriberRelation.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-4">
                      {watchSecondarySubscriberRelation &&
                      watchSecondarySubscriberRelation !== "Self" ? (
                        <>
                          <FormField
                            id="secondarySubscriberName"
                            label={t.subscriberName}
                            register={register}
                            error={errors.secondarySubscriberName}
                            required
                          />
                          <FormField
                            id="secondarySubscriberDOB"
                            label={t.subscriberDOB}
                            type="date"
                            register={register}
                            error={errors.secondarySubscriberDOB}
                            required
                          />
                        </>
                      ) : null}
                      <FormField
                        id="secondarySubscriberID"
                        label={t.subscriberID}
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
                <h2 className="text-xl font-medium text-gray-700">
                  {t.section7Title}
                </h2>

                <FormField
                  id="reasonForSeekingServices"
                  label={t.reasonForServices}
                  register={register}
                  error={errors.reasonForSeekingServices}
                  multiline
                  rows={4}
                  required
                />

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-3">
                    {t.selectAllApply}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {therapyReasons.map((reason) => (
                      <div
                        key={reason}
                        className="flex items-center bg-gray-50 p-2 rounded-md"
                      >
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
                                  field.onChange(
                                    field.value?.filter(
                                      (value) => value !== reason,
                                    ),
                                  );
                                }
                              }}
                            />
                          )}
                        />
                        <Label
                          htmlFor={`reason-${reason}`}
                          className="ml-2 text-gray-700"
                        >
                          {t.therapyReasons[reason as keyof typeof t.therapyReasons] || reason}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.reasonsForTherapy && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.reasonsForTherapy.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section 8: Prior Counseling */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-700">
                  {t.section8Title}
                </h2>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.priorCounselingQuestion}{" "}
                    <span className="text-red-500">*</span>
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
                        {(["Yes", "No"] as const).map((option) => (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem
                              id={`prior-counseling-${option}`}
                              value={option}
                            />
                            <Label
                              htmlFor={`prior-counseling-${option}`}
                              className="ml-2"
                            >
                              {option === "Yes" ? t.yes : t.no}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                  {errors.priorCounseling && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.priorCounseling.message}
                    </p>
                  )}
                </div>

                {watchPriorCounseling === "Yes" && (
                  <div className="mt-4 space-y-4">
                    <FormField
                      id="priorCounselingDetails"
                      label={t.priorCounselingDetails}
                      register={register}
                      error={errors.priorCounselingDetails}
                      multiline={true}
                      rows={3}
                      required={watchPriorCounseling === "Yes"}
                    />

                    <FormField
                      id="whoTheySawBefore"
                      label={t.whoSawBefore}
                      register={register}
                      error={errors.whoTheySawBefore}
                    />

                    <div className="space-y-3">
                      <Controller
                        control={control}
                        name="wasAtTFC"
                        render={({ field }) => (
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <Checkbox
                                id="wasAtTFC"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <Label
                                htmlFor="wasAtTFC"
                                className="text-gray-700"
                              >
                                {t.wasAtTFC}
                              </Label>
                            </div>
                          </div>
                        )}
                      />

                      {watchWasAtTFC && (
                        <FormField
                          id="providerRequested"
                          label={t.ifYesWho}
                          register={register}
                          error={errors.providerRequested}
                        />
                      )}
                    </div>

                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.outcomeLabel}
                      </Label>
                      <Controller
                        control={control}
                        name="priorOutcome"
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t.outcomePlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {(["Successful", "Somewhat helpful", "Not helpful", "Incomplete", "Other"] as const).map((opt) => (
                                <SelectItem key={opt} value={opt}>{t.outcomeOptions[opt]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.priorOutcome && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.priorOutcome.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 9: Signature */}
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">
                  {t.section9Title}
                </h2>

                <div className="border border-gray-200 bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 mb-4">
                    {t.signatureDisclaimer}
                  </p>

                  <FormField
                    id="initials"
                    label={t.digitalSignature}
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
                            <Label
                              htmlFor="confirmAccuracy"
                              className="text-gray-700"
                            >
                              {t.confirmAccuracy}{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                          </div>
                        </div>
                      )}
                    />
                    {errors.confirmAccuracy && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmAccuracy.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <SubmitButton
                isSubmitting={isSubmitting}
                submitText={t.submitButton}
                submittingText={t.submittingButton}
                privacyText={t.privacyNotice}
              />
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
