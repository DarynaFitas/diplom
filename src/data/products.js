export const products = [
  {
    id: 1,
    name: 'BMW M3 GTR 1:24',
    price: 890,
    category: 'Колекційні машинки',
    description: 'Деталізована металева модель BMW M3 GTR у масштабі 1:24 для демонстрації подій GA4.',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    name: 'Porsche 911 Turbo 1:32',
    price: 650,
    category: 'Спортивні моделі',
    description: 'Тестовий товар для відстеження подій add_to_cart та purchase у магазині машинок.',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'Mercedes G-Class 1:24',
    price: 990,
    category: 'Позашляховики',
    description: 'Модель позашляховика для сторінки перегляду товару та демонстрації e-commerce аналітики.',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
  },
]

export function getProductById(id) {
  return products.find((product) => product.id === Number(id))
}
