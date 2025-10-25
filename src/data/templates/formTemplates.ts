export interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'phone' | 'select' | 'checkbox' | 'file';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormBranding {
  primaryColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  font: string;
  logo_url?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  theme: string;
  fields: FormField[];
  branding: FormBranding;
  thumbnail?: string;
}

export const formTemplates: FormTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional with blue accents",
    theme: "blue",
    fields: [
      {
        id: "company_name",
        type: "text",
        label: "Company Name",
        required: true,
        placeholder: "Enter your company name"
      },
      {
        id: "contact_email",
        type: "email",
        label: "Contact Email",
        required: true,
        placeholder: "your@email.com"
      },
      {
        id: "project_description",
        type: "textarea",
        label: "Project Description",
        required: false,
        placeholder: "Tell us about your project"
      }
    ],
    branding: {
      primaryColor: "#2b6cb0",
      buttonStyle: "rounded",
      font: "Inter"
    }
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant design",
    theme: "gray",
    fields: [
      {
        id: "full_name",
        type: "text",
        label: "Full Name",
        required: true,
        placeholder: "John Doe"
      },
      {
        id: "email",
        type: "email",
        label: "Email Address",
        required: true,
        placeholder: "john@example.com"
      },
      {
        id: "phone",
        type: "phone",
        label: "Phone Number",
        required: false,
        placeholder: "+1 (555) 000-0000"
      },
      {
        id: "message",
        type: "textarea",
        label: "Message",
        required: false,
        placeholder: "Your message here..."
      }
    ],
    branding: {
      primaryColor: "#6b7280",
      buttonStyle: "square",
      font: "System"
    }
  },
  {
    id: "agency-blue",
    name: "Agency Blue",
    description: "Bold and vibrant for creative agencies",
    theme: "blue",
    fields: [
      {
        id: "business_name",
        type: "text",
        label: "Business Name",
        required: true,
        placeholder: "Your business name"
      },
      {
        id: "email",
        type: "email",
        label: "Email",
        required: true,
        placeholder: "contact@business.com"
      },
      {
        id: "service_interest",
        type: "select",
        label: "Service of Interest",
        required: true,
        options: ["Web Design", "Branding", "Marketing", "Development", "Other"]
      },
      {
        id: "budget",
        type: "select",
        label: "Budget Range",
        required: false,
        options: ["$5k-$10k", "$10k-$25k", "$25k-$50k", "$50k+"]
      },
      {
        id: "details",
        type: "textarea",
        label: "Project Details",
        required: true,
        placeholder: "Tell us about your project..."
      }
    ],
    branding: {
      primaryColor: "#1e40af",
      buttonStyle: "pill",
      font: "Inter"
    }
  },
  {
    id: "clean",
    name: "Clean",
    description: "Fresh and modern with green accents",
    theme: "green",
    fields: [
      {
        id: "name",
        type: "text",
        label: "Your Name",
        required: true,
        placeholder: "Enter your name"
      },
      {
        id: "email",
        type: "email",
        label: "Your Email",
        required: true,
        placeholder: "you@example.com"
      },
      {
        id: "company",
        type: "text",
        label: "Company",
        required: false,
        placeholder: "Your company name"
      },
      {
        id: "inquiry",
        type: "textarea",
        label: "How can we help?",
        required: true,
        placeholder: "Describe your needs..."
      }
    ],
    branding: {
      primaryColor: "#059669",
      buttonStyle: "rounded",
      font: "Inter"
    }
  }
];
