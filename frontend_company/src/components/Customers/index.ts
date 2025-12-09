export { default as CustomerManagement } from "./CustomerManagement"
export { default as AddCustomer } from "./AddCustomer"
export { default as EditCustomer } from "./EditCustomer"
export { default as DeleteCustomer } from "./DeleteCustomer"

// Export types from client
export type { 
  CustomerCreate, 
  CustomerUpdate, 
  CustomerUpdateMe, 
  CustomerPublic, 
  CustomersPublic,
  CustomerStats 
} from "@/client"
