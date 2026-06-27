// Formatage d'affichage uniquement : la valeur nettoyee (sans espaces) est ce qui est envoye a l'API.
export function formatFieldValue(field, text) {
  if (field.format === 'pan') {
    return text.replace(/\D/g, '').slice(0, 19).replace(/(.{4})(?=.)/g, '$1 ');
  }
  if (field.format === 'amount') {
    const digits = text.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  return text;
}

export function cleanFieldValue(field, text) {
  if (field.format === 'pan' || field.format === 'amount') {
    return String(text ?? '').replace(/\s+/g, '');
  }
  return text;
}
