UPDATE credit_note
SET status = 'creditNote.status.unpaid'
WHERE status IN ('creditNote.status.validated', 'creditNote.status.sent');
