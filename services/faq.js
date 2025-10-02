const FAQ_DATABASE = {
    // Загальна інфо
    general: {
        working_hours: {
            keywords: ['години роботи', 'коли працюєте', 'розклад роботи', 'працює до', 'відчинено'],
            answer: `🕒 **Години роботи нашого центру:**
            
                    📅 **Пн-Пт:** 7:00 - 22:00
                    📅 **Сб-Нд:** 9:00 - 20:00

                    ☎️ Телефон для довідок: +380 XX XXX XX XX`
        },
        
        location: {
            keywords: ['де знаходитесь', 'адреса', 'локація', 'як дістатися', 'проїзд'],
            answer: `📍 **Наша адреса:**
            
                    🏢 м. Київ, вул. Тараса Шевченка, 17
                    🚇 **Метро:** ст. "Університет" (11 хв пішки)
                    🚌 **Автобус:** №15, 20, 45 (зупинка "Спортивний центр")
                    🚗 **Авто:** Безкоштовна парковка для клієнтів`
        },

        contacts: {
            keywords: ['контакти', 'телефон', 'зв\'язок', 'номер телефону'],
            answer: `📞 **Наші контакти:**
            
                    ☎️ **Телефон:** +380 XX XXX XX XX
                    📧 **Email:** info@leanlift.ua  
                    💬 **Telegram:** @leanliftUA
                    📱 **Viber:** +380 XX XXX XX XX
                            
                    🕒 Колл-центр працює: Пн-Пт 8:00-20:00`
        },

        prices_general: {
            keywords: ['ціни', 'вартість', 'скільки коштує', 'прайс', 'тариф'],
            answer: `💰 **Базові ціни:**
            
                    🎫 **Разове відвідування:** 150-300 грн
                    📅 **Місячний абонемент:** 800-1500 грн  
                    👥 **Групові тренування:** 200-400 грн
                    👨‍💼 **Персональні тренування:** 500-800 грн

                    🎯 Точні ціни залежать від типу тренування
                    💳 Приймаємо готівку та картки
                    🎁 Діють знижки для студентів та пенсіонерів`
        }
    },

    // Тренування та послуги
    training: {
        what_to_bring: {
            keywords: ['що взяти', 'що потрібно', 'форма', 'одяг', 'взуття'],
            answer: `🎒 **Що взяти з собою:**
            
                    👕 **Спортивний одяг:** зручна форма
                    👟 **Взуття:** кросівки з гумовою підошвою
                    🧴 **Гігієна:** рушник, засоби для душу
                    💧 **Вода:** пляшка води (обов'язково!)
                            
                    🏊‍♂️ **Для плавання:** плавки/купальник, шапочка
                    🧘‍♀️ **Для йоги:** килимок (або оренда в центрі)
                    🥊 **Для боксу:** бинти, рукавички (або оренда)`
        },

        for_beginners: {
            keywords: ['початківець', 'новачок', 'вперше', 'ніколи не займався', 'з чого почати'],
            answer: `🔰 **Рекомендації для початківців:**
            
                    ✅ **Кращі напрямки для старту:**
                    • Йога - м'яке введення в спорт
                    • Кардіо - покращення витривалості  
                    • Тренажерний зал з тренером

                    📋 **Перший візит:**
                    1️⃣ Консультація з лікарем (рекомендовано)
                    2️⃣ Знайомство з тренером
                    3️⃣ Складання індивідуальної програми
                    4️⃣ Пробне тренування

                    💡 **Поради:** Починайте поступово, слухайте тренера, не забувайте про розминку!`
        },

        group_vs_personal: {
            keywords: ['групові чи персональні', 'різниця', 'що краще', 'індивідуальні'],
            answer: `⚖️ **Групові VS Персональні тренування:**
            
                    👥 **Групові тренування:**
                    ✅ Нижча вартість
                    ✅ Мотивація від групи  
                    ✅ Соціалізація
                    ❌ Менше уваги тренера

                    👨‍💼 **Персональні тренування:**
                    ✅ Індивідуальна програма
                    ✅ 100% уваги тренера
                    ✅ Швидший результат
                    ❌ Вища вартість

                    🎯 **Рекомендація:** Початківцям краще персональні, досвідченим - групові`
        }
    },

    // Технічні питання
    technical: {
        booking_process: {
            keywords: ['як записатися', 'запис', 'реєстрація', 'бронювання'],
            answer: `📝 **Як записатися на тренування:**
            
                    🌐 **Онлайн (рекомендовано):**
                    1️⃣ Увійдіть в особистий кабінет на сайті
                    2️⃣ Оберіть "Записатися на тренування"  
                    3️⃣ Виберіть дату та час
                    4️⃣ Підтвердіть запис

                    ☎️ **По телефону:** +380 XX XXX XX XX

                    🏢 **На рецепції:** щодня з 8:00 до 20:00

                    ⚠️ **Важливо:** Скасування запису можливе не пізніше за 2 години до початку тренування`
        },

        cancellation: {
            keywords: ['скасування', 'відмінити', 'не можу прийти', 'перенести'],
            answer: `❌ **Скасування запису:**
            
                    ⏰ **Умови скасування:**
                    Скасування запису можливе не пізніше за 2 години до початку тренування

                    📱 **Способи скасування:**
                    1️⃣ Особистий кабінет на сайті
                    2️⃣ Дзвінок на рецепцію
                    3️⃣ Повідомлення в Telegram/Viber`
        },

        payment_methods: {
            keywords: ['оплата', 'як платити', 'картка', 'готівка', 'розстрочка'],
            answer: `💳 **Способи оплати:**
            
                    💰 **Готівка:** На рецепції
                    💳 **Банківська карта:** Visa, MasterCard
                    📱 **Безконтактна оплата:** Apple Pay, Google Pay
                    🏧 **Термінал:** На рецепції

                    📊 **Варіанти покупки:**
                    • Разові заняття
                    • Абонементи на 4/8/12 занять
                    • Місячні безлімітні абонементи
                    • Річні абонементи зі знижкою`
        }
    },

    // Здоров'я та безпека
    health: {
        medical_restrictions: {
            keywords: ['протипоказання', 'хвороби', 'травми', 'лікар', 'медогляд'],
            answer: `⚕️ **Медичні обмеження:**
            
                    📋 **Обов'язкова консультація лікаря при:**
                    • Серцево-судинних захворюваннях
                    • Проблемах з опорно-руховим апаратом  
                    • Хронічних захвороюваннях
                    • Вагітності

                    🔍 **У нас є медогляд:**
                    • Вимірювання тиску та пульсу
                    • Консультація спортивного лікаря
                    • Складання індивідуальних рекомендацій

                    ⚠️ **При погіршенні самопочуття негайно зверніться до тренера!**`
        },

        injury_prevention: {
            keywords: ['травми', 'безпека', 'як не травмуватися', 'профілактика'],
            answer: `🛡️ **Профілактика травм:**
            
                    🔥 **Обов'язкова розминка:** 10-15 хвилин
                    🏃‍♂️ **Правильна техніка:** слухайте тренера
                    💧 **Гідратація:** пийте воду під час тренування
                    😴 **Відпочинок:** між підходами та тренуваннями
                            
                    ⚠️ **При появі болю:**
                    1️⃣ Негайно зупиніть вправу  
                    2️⃣ Повідомте тренера
                    3️⃣ Зверніться до медика центру
                            
                    🧊 **Перша допомога:** Лід, спокій, піднесення кінцівки`
        }
    }
};

// Нормалізація тексту: прибираємо діакритичні знаки, пунктуацію, зводимо до нижнього регістру
function normalizeText(str) {
    if (!str) return '';
    return str.toString()
        .normalize('NFKD')                         // розділяє діакритичні знаки
        .replace(/[\u0300-\u036f]/g, '')           // видаляємо діакритичні знаки
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')         // залишаємо лише букви, цифри та пробіли (Unicode-safe)
        .replace(/\s+/g, ' ')
        .trim();
}

// Розширений пошук по FAQ — знаходить ключові слова
function searchFAQ(question) {
    const normQuestion = normalizeText(question);
    if (!normQuestion) return { found: false };

    // Зберігаємо найкращий частковий матч на випадок, якщо повних немає
    let bestPartial = { found: false, answer: null, confidence: 0, keyword: null };

    for (const category of Object.values(FAQ_DATABASE)) {
        for (const item of Object.values(category)) {
            for (const keyword of item.keywords) {
                const normKeyword = normalizeText(keyword);
                if (!normKeyword) continue;

                // 1) Прямий підрядковий матч (фраза цілком міститься в питанні)
                if (normQuestion.includes(normKeyword)) {
                    const confidence = calculateConfidence(normQuestion, item.keywords);
                    return { found: true, answer: item.answer, confidence, matchedKeyword: keyword };
                }

                // 2) Якщо всі токени ключового слова присутні (навіть в іншому порядку)
                const kTokens = normKeyword.split(' ').filter(Boolean);
                if (kTokens.length > 0) {
                    const matchedTokens = kTokens.filter(t => normQuestion.includes(t)).length;
                    if (matchedTokens === kTokens.length) {
                        const confidence = calculateConfidence(normQuestion, item.keywords);
                        return { found: true, answer: item.answer, confidence, matchedKeyword: keyword };
                    }

                    // 3) Частковий матч — збираємо найкращий для можливого повернення
                    const partialScore = Math.round((matchedTokens / kTokens.length) * 100);
                    if (partialScore > bestPartial.confidence && partialScore >= 40) { // мінімум 40% для часткового
                        bestPartial = { found: true, answer: item.answer, confidence: partialScore, keyword };
                    }
                }
            }
        }
    }

    // Якщо знайшли прийнятний частковий матч — повертаємо його
    if (bestPartial.found) {
        return { found: true, answer: bestPartial.answer, confidence: bestPartial.confidence, matchedKeyword: bestPartial.keyword };
    }

    return { found: false };
}

// Розрахунок "впевненості" — оцінюємо по кращому ключовому слову
function calculateConfidence(question, keywords) {
    const nq = normalizeText(question);
    let best = 0;

    for (const kw of keywords) {
        const nk = normalizeText(kw);
        if (!nk) continue;

        if (nq.includes(nk)) {
            best = Math.max(best, 100);
            continue;
        }

        const tokens = nk.split(' ').filter(Boolean);
        if (tokens.length === 0) continue;
        const matches = tokens.filter(t => nq.includes(t)).length;
        const score = Math.round((matches / tokens.length) * 100);
        best = Math.max(best, score);
    }

    return best;
}

// Генерація швидких відповідей
function getRandomFAQs(count = 6) {
    const allItems = [];

    for (const category of Object.values(FAQ_DATABASE)) {
        for (const [key, item] of Object.entries(category)) {
            allItems.push({
                id: key,
                // відображуваний текст (гарно виглядає на кнопці)
                text: capitalizeFirst(item.keywords[0] || key) + ' ?',
                // реальне ключове слово, що буде відправлено на бекенд для точного пошуку
                question: item.keywords[0] || key,
                answer: item.answer
            });
        }
    }

    return allItems
        .sort(() => 0.5 - Math.random())
        .slice(0, count)
        .map(item => ({
            id: item.id,
            text: item.text,
            question: item.question
        }));
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
    FAQ_DATABASE,
    searchFAQ,
    getRandomFAQs
};