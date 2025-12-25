export type PlanCategory = 'funeral' | 'cremation';

export type PlanId = 'a' | 'b' | 'c' | 'd';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  category: PlanCategory;
  description: string;
}

export type AttendeeTier = 'A' | 'B' | 'C' | 'D';

export interface AttendeeOption {
  tier: AttendeeTier;
  label: string;
  description: string;
}

// Item Types
export type ItemType = 'included' | 'checkbox' | 'dropdown' | 'tier_dependent' | 'free_input';

export interface DropdownOption {
  id: string;
  name: string;
  price: number;
  allowedPlans: PlanId[];
}

export interface ItemDetail {
  title?: string;
  description: string;
  imagePath?: string;
}

export interface Item {
  id: number;
  name: string;
  description: string; // Used for modal
  displayOrder: number;
  type: ItemType;
  allowedPlans: PlanId[]; // Which plans show this item

  // Pricing strategies
  basePrice?: number; // For checkboxes
  options?: DropdownOption[]; // For dropdowns
  tierPrices?: Record<AttendeeTier, number>; // For tier dependent items

  // Extended details for modal
  details?: ItemDetail[];

  // New flag for included items to use dropdown
  useDropdown?: boolean;
}

export interface SelectedState {
  category: PlanCategory;
  planId: PlanId;
  attendeeTier: AttendeeTier;
  attendeeCountText: string;
  selectedOptions: Set<number>; // Set of Item IDs (for checkboxes)
  selectedGrades: Map<number, string>; // Item ID -> Dropdown Option ID
}