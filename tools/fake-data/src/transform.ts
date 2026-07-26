import { faker } from '@faker-js/faker';
export function generateFakeData(type: 'person' | 'address' | 'company' | 'creditCard'): string {
  if (type === 'person')
    return faker.person.fullName() + ' \n' + faker.internet.email() + ' \n' + faker.phone.number();
  if (type === 'address')
    return (
      faker.location.streetAddress() + ', ' + faker.location.city() + ' ' + faker.location.zipCode()
    );
  if (type === 'company') return faker.company.name() + ' - ' + faker.company.catchPhrase();
  if (type === 'creditCard') return faker.finance.creditCardNumber();
  return '';
}
