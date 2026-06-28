export enum EVENT_TYPE {
  //Auth
  SIGNIN = 'signin',
  REGISTER = 'register',

  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',

  //Role
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  ROLE_DUPLICATED = 'role_duplicated',

  //Firm
  FIRM_CREATED = 'firm_created',
  FIRM_UPDATED = 'firm_updated',
  FIRM_DELETED = 'firm_deleted',

  //interlocutor
  INTERLOCUTOR_CREATED = 'interlocutor_created',
  INTERLOCUTOR_UPDATED = 'interlocutor_updated',
  INTERLOCUTOR_DELETED = 'interlocutor_deleted',
  INTERLOCUTOR_PROMOTED = 'interlocutor_promoted',

  //Selling Quotation
  SELLING_QUOTATION_CREATED = 'quotation_created',
  SELLING_QUOTATION_UPDATED = 'quotation_updated',
  SELLING_QUOTATION_DELETED = 'quotation_deleted',
  SELLING_QUOTATION_PRINTED = 'quotation_printed',
  SELLING_QUOTATION_INVOICED = 'quotation_invoiced',
  SELLING_QUOTATION_DUPLICATED = 'quotation_duplicated',

  //Selling Invoice
  SELLING_INVOICE_CREATED = 'invoice_created',
  SELLING_INVOICE_UPDATED = 'invoice_updated',
  SELLING_INVOICE_DELETED = 'invoice_deleted',
  SELLING_INVOICE_PRINTED = 'invoice_printed',
  SELLING_INVOICE_DUPLICATED = 'invoice_duplicated',

  //Selling Delivery Note
  SELLING_DELIVERY_NOTE_CREATED = 'delivery_note_created',
  SELLING_DELIVERY_NOTE_UPDATED = 'delivery_note_updated',
  SELLING_DELIVERY_NOTE_DELETED = 'delivery_note_deleted',
  SELLING_DELIVERY_NOTE_PRINTED = 'delivery_note_printed',
  SELLING_DELIVERY_NOTE_INVOICED = 'delivery_note_invoiced',
  SELLING_DELIVERY_NOTE_DUPLICATED = 'delivery_note_duplicated',

  //Selling Goods Issue Note
  SELLING_GOODS_ISSUE_NOTE_CREATED = 'goods_issue_note_created',
  SELLING_GOODS_ISSUE_NOTE_UPDATED = 'goods_issue_note_updated',
  SELLING_GOODS_ISSUE_NOTE_DELETED = 'goods_issue_note_deleted',
  SELLING_GOODS_ISSUE_NOTE_PRINTED = 'goods_issue_note_printed',
  SELLING_GOODS_ISSUE_NOTE_INVOICED = 'goods_issue_note_invoiced',
  SELLING_GOODS_ISSUE_NOTE_DUPLICATED = 'goods_issue_note_duplicated',

  //Selling Customer Order
  SELLING_CUSTOMER_ORDER_CREATED = 'customer_order_created',
  SELLING_CUSTOMER_ORDER_UPDATED = 'customer_order_updated',
  SELLING_CUSTOMER_ORDER_DELETED = 'customer_order_deleted',
  SELLING_CUSTOMER_ORDER_PRINTED = 'customer_order_printed',
  SELLING_CUSTOMER_ORDER_INVOICED = 'customer_order_invoiced',
  SELLING_CUSTOMER_ORDER_DUPLICATED = 'customer_order_duplicated',

  //Selling Credit Note
  SELLING_CREDIT_NOTE_CREATED = 'credit_note_created',
  SELLING_CREDIT_NOTE_UPDATED = 'credit_note_updated',
  SELLING_CREDIT_NOTE_DELETED = 'credit_note_deleted',
  SELLING_CREDIT_NOTE_PRINTED = 'credit_note_printed',
  SELLING_CREDIT_NOTE_DUPLICATED = 'credit_note_duplicated',

  //Selling Return Note
  SELLING_RETURN_NOTE_CREATED = 'return_note_created',
  SELLING_RETURN_NOTE_UPDATED = 'return_note_updated',
  SELLING_RETURN_NOTE_DELETED = 'return_note_deleted',
  SELLING_RETURN_NOTE_PRINTED = 'return_note_printed',
  SELLING_RETURN_NOTE_INVOICED = 'return_note_invoiced',
  SELLING_RETURN_NOTE_DUPLICATED = 'return_note_duplicated',

  //Selling Payment
  SELLING_PAYMENT_CREATED = 'payment_created',
  SELLING_PAYMENT_UPDATED = 'payment_updated',
  SELLING_PAYMENT_DELETED = 'payment_deleted',

  //Content
  ACTIVITY_CREATED = 'activity_created',
  ACTIVITY_UPDATED = 'activity_updated',
  ACTIVITY_DELETED = 'activity_deleted',

  BANK_ACCOUNT_CREATED = 'bank_account_created',
  BANK_ACCOUNT_UPDATED = 'bank_account_updated',
  BANK_ACCOUNT_DELETED = 'bank_account_deleted',
  TREASURY_MOVEMENT_CREATED = 'treasury_movement_created',
  TREASURY_MOVEMENT_DELETED = 'treasury_movement_deleted',

  DEFAULT_CONDITION_CREATED = 'default_condition_created',
  DEFAULT_CONDITION_UPDATED = 'default_condition_updated',
  DEFAULT_CONDITION_MASS_UPDATED = 'default_conditions_updated',
  DEFAULT_CONDITION_DELETED = 'default_condition_deleted',

  PAYMENT_CONDITION_CREATED = 'payment_condition_created',
  PAYMENT_CONDITION_UPDATED = 'payment_condition_updated',
  PAYMENT_CONDITION_DELETED = 'payment_condition_deleted',

  PRICE_LIST_CREATED = 'price_list_created',
  PRICE_LIST_UPDATED = 'price_list_updated',
  PRICE_LIST_DELETED = 'price_list_deleted',

  TAX_WITHHOLDING_CREATED = 'tax_withholding_created',
  TAX_WITHHOLDING_UPDATED = 'tax_withholding_updated',
  TAX_WITHHOLDING_DELETED = 'tax_withholding_deleted',

  TAX_CREATED = 'tax_created',
  TAX_UPDATED = 'tax_updated',
  TAX_DELETED = 'tax_deleted',

  TEMPLATE_CATEGORY_CREATED = 'template_category_created',
  TEMPLATE_CATEGORY_UPDATED = 'template_category_updated',
  TEMPLATE_CATEGORY_DELETED = 'template_category_deleted',

  FIRM_BANK_ACCOUNT_CREATED = 'firm_bank_account_created',
  FIRM_BANK_ACCOUNT_UPDATED = 'firm_bank_account_updated',
  FIRM_BANK_ACCOUNT_DELETED = 'firm_bank_account_deleted',

  SEQUENCE_UPDATED = 'sequence_updated',
}
