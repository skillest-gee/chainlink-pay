export type PlaceholderType = 'uint' | 'principal' | 'string' | 'buffer';

export interface TemplatePlaceholder {
  key: string;
  type: PlaceholderType;
  required: boolean;
  description?: string;
}

export interface ContractTemplate {
  id: 'ESCROW' | 'SPLIT' | 'SUBSCRIPTION';
  name: string;
  description: string;
  source: string; // Clarity source with {{placeholders}}
  placeholders: TemplatePlaceholder[];
  version: string;
}

export type TemplateInput = Record<string, unknown>;

export interface GeneratedContract {
  templateId: ContractTemplate['id'];
  source: string; // fully interpolated Clarity code
  metadata: {
    version: string;
    filledKeys: string[];
  };
}

