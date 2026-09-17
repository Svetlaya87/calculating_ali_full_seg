//нарешті робочий варіант
// додана можливість додавати товари з іншою ціною
// Автоматичний розрахунок відсотка для конкретного рядка
//додавання митних лімітів і людей
function calculatePromoPercent(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    const discountInput = row.querySelector('.promo-discount');
    const thresholdInput = row.querySelector('.promo-threshold');
    const percentField = row.querySelector('.promo-percent');
    
    if (!discountInput || !thresholdInput || !percentField) return;

    const discount = parseFloat(discountInput.value) || 0;
    const threshold = parseFloat(thresholdInput.value) || 0;
    
    if (threshold > 0) {
        percentField.value = ((discount / threshold) * 100).toFixed(2);
    } else {
        percentField.value = "0.00";
    }
}

// Ініціалізація відстеження змін у ВСІЙ таблиці промокодів (працює і для нових рядків)
document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById('promocodesTable');
    if (table) {
        table.addEventListener('input', (event) => {
            if (event.target.classList.contains('promo-discount') || event.target.classList.contains('promo-threshold')) {
                calculatePromoPercent(event.target);
            }
        });
    }
});

// Оновлена функція додавання нового рядка промокоду
function addPromoRow() {
    const tbody = document.querySelector('#promocodesTable tbody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="text" placeholder="Новий промокод"></td>
        <td><input type="number" class="promo-discount" value="0"></td>
        <td><input type="number" class="promo-threshold" value="0"></td>
        <td><input type="number" class="promo-percent" readonly value="0.00"></td>
        <td class="actions-cell"><button class="btn btn-danger" onclick="deleteRow(this)">❌</button></td>
    `;
    
    tbody.appendChild(newRow);
}


// Видалення рядка промокоду
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
}


javascript// Додавання нового рядка товару
function addProductRow() {
    const tbody = document.querySelector('#productsTable tbody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="text" placeholder="Назва товару (напр. Мотори Б)"></td>
        <td><input type="number" class="price" value="0.00"></td>
        <td><input type="number" class="min-qty" value="0"></td>
        <td><input type="number" class="max-qty" value="0"></td>
        <td class="actions-cell"><button class="btn btn-danger" onclick="deleteRow(this)">❌</button></td>
    `;
    
    tbody.appendChild(newRow);
}

// Автоматичний розрахунок вільного ліміту для конкретної людини
function calculateFreeLimit(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    const globalLimit = parseFloat(document.getElementById('customsLimit').value) || 0;
    const inTransit = parseFloat(row.querySelector('.in-transit').value) || 0;
    const freeLimitField = row.querySelector('.free-limit');
    
    if (freeLimitField) {
        freeLimitField.value = (globalLimit - inTransit).toFixed(2);
    }
}

// Оновлення лімітів у ВСІХ людей одночасно (якщо змінили глобальний ліміт)
function updateAllFreeLimits() {
    document.querySelectorAll('#peopleTable tbody tr').forEach(row => {
        const inTransitInput = row.querySelector('.in-transit');
        if (inTransitInput) {
            calculateFreeLimit(inTransitInput);
        }
    });
}

// Додавання нової людини в таблицю лімітів
function addPersonRow() {
    const tbody = document.querySelector('#peopleTable tbody');
    const newRow = document.createElement('tr');
    const globalLimit = parseFloat(document.getElementById('customsLimit').value) || 0;
    
    newRow.innerHTML = `
        <td><input type="text" placeholder="Ім'я одержувача"></td>
        <td><input type="number" class="in-transit" value="0" oninput="calculateFreeLimit(this)"></td>
        <td><input type="number" class="free-limit" readonly value="${globalLimit.toFixed(2)}"></td>
        <td class="actions-cell"><button class="btn btn-danger" onclick="deleteRow(this)">❌</button></td>
    `;
    
    tbody.appendChild(newRow);
}



function optimizePurchase() {
    // 1. Збір даних про товари
    const products = [];
    document.querySelectorAll('#productsTable tbody tr').forEach(row => {
        const nameInput = row.querySelector('td:first-child input');
        const name = nameInput ? (nameInput.value || "Товар") : "Товар";
        products.push({
            name: name,
            price: parseFloat(row.querySelector('.price').value) || 0,
            minQty: parseInt(row.querySelector('.min-qty').value) || 0,
            maxQty: parseInt(row.querySelector('.max-qty').value) || 0
        });
    });

    // 2. Збір даних про промокоди
    const promos = [];
    document.querySelectorAll('#promocodesTable tbody tr').forEach(row => {
        const nameInput = row.querySelector('td:first-child input');
        const name = nameInput ? (nameInput.value || "Промокод") : "Промокод";
        const discount = parseFloat(row.querySelector('.promo-discount').value) || 0;
        const threshold = parseFloat(row.querySelector('.promo-threshold').value) || 0;
        if (discount > 0 && threshold > 0) {
            promos.push({ name, discount, threshold });
        }
    });

    if (promos.length === 0) {
        alert("Будь ласка, додайте діючі промокоди.");
        return;
    }

    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    resultDiv.style.display = 'block';
    resultContent.innerHTML = `<p style="font-weight:bold; color:#d35400;">⏳ Виконується точний математичний аналіз комбінацій...</p>`;

    // Фільтруємо лише активні товари (де макс > 0)
    const activeProducts = products.filter(p => p.maxQty > 0);

    // Генеруємо діапазони кількостей від min до max
    let qtyRanges = activeProducts.map(p => {
        let ranges = [];
        for (let q = p.minQty; q <= p.maxQty; q++) {
            ranges.push(q);
        }
        return ranges;
    });

    function cartesianProduct(arrays) {
        return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]]);
    }

    const allQtyCombinations = cartesianProduct(qtyRanges);

    // Розраховуємо вартість для кожної комбінації кількостей
    let combosWithCost = allQtyCombinations.map(comb => {
        let cost = 0;
        comb.forEach((qty, idx) => {
            cost += activeProducts[idx].price * qty;
        });
        return { comb, cost };
    });

    // Сортуємо від найдешевших варіантів закупівлі до найдорожчих
    combosWithCost.sort((a, b) => a.cost - b.cost);

    const sortedPromos = [...promos].sort((a, b) => b.threshold - a.threshold);
    const totalThresholdRequired = sortedPromos.reduce((sum, p) => sum + p.threshold, 0);
    const totalDiscountSum = sortedPromos.reduce((sum, p) => sum + p.discount, 0);

    let bestPromosDistribution = null;
    let bestTotalCost = 0;
    let bestGlobalRatio = 0;

    // Рекурсивна функція точного пошуку розподілу з жорсткою валідацією порогів
    function findAssignment(itemIdx, currentSums, assignment, promosList, itemsList, suffixSums) {
        // ВИПРАВЛЕНО: Коли всі товари розподілено, перевіряємо, чи абсолютно КОЖЕН кошик набрав свій поріг
        if (itemIdx === itemsList.length) {
            for (let i = 0; i < promosList.length; i++) {
                if (currentSums[i] < promosList[i].threshold) {
                    return null; // Якщо хоча б один не набрав поріг — цей розподіл анулюється
                }
            }
            return [...assignment];
        }

        let missing = 0;
        for (let i = 0; i < promosList.length; i++) {
            if (currentSums[i] < promosList[i].threshold) {
                missing += (promosList[i].threshold - currentSums[i]);
            }
        }
        
        // Оптимізація: якщо суми деталей, що залишилися, фізично не вистачить для покриття порогів — зупиняємо пошук
        if (suffixSums[itemIdx] < missing) {
            return null;
        }

        let price = itemsList[itemIdx].price;
        for (let i = 0; i < promosList.length; i++) {
            currentSums[i] += price;
            assignment[itemIdx] = i;
            let res = findAssignment(itemIdx + 1, currentSums, assignment, promosList, itemsList, suffixSums);
            if (res) return res;
            currentSums[i] -= price;
        }
        return null;
    }

    // Перебираємо кожну комбінацію закупівлі, починаючи з найдешевшої
    for (let targetCombo of combosWithCost) {
        if (targetCombo.cost < totalThresholdRequired) continue;

        let currentPool = [];
        targetCombo.comb.forEach((qty, index) => {
            const prod = activeProducts[index];
            for (let i = 0; i < qty; i++) {
                currentPool.push({ name: prod.name, price: prod.price });
            }
        });

        // Сортуємо деталі від дорогих до дешевих
        currentPool.sort((a, b) => b.price - a.price);

        // Розрахунок суфіксних сум
        let suffixSums = new Array(currentPool.length);
        let s = 0;
        for (let i = currentPool.length - 1; i >= 0; i--) {
            s += currentPool[i].price;
            suffixSums[i] = s;
        }

        let currentSums = new Array(sortedPromos.length).fill(0);
        let assignment = new Array(currentPool.length).fill(-1);

        let finalAssignment = findAssignment(0, currentSums, assignment, sortedPromos, currentPool, suffixSums);

        if (finalAssignment) {
            bestTotalCost = targetCombo.cost;
            bestGlobalRatio = (totalDiscountSum / bestTotalCost) * 100;

            bestPromosDistribution = sortedPromos.map(p => ({ ...p, items: [], totalCost: 0 }));
            for (let i = 0; i < currentPool.length; i++) {
                let pIdx = finalAssignment[i];
                bestPromosDistribution[pIdx].items.push(currentPool[i]);
                bestPromosDistribution[pIdx].totalCost += currentPool[i].price;
            }
            break; // Стоп на першій математично бездоганній комбінації!
        }
    }

    // 4. Виведення результатів
    if (!bestPromosDistribution) {
        resultContent.innerHTML = `<p style="color:red; font-weight:bold;">При поточних лімітах "Макс. кількість" неможливо підібрати комбінацію товарів, яка б ПОВНІСТЮ закрила пороги ВСІХ промокодів одночасно!</p>`;
        return;
    }

    let html = `<h2>Розподіл закупівлі за промокодами (Абсолютний математичний максимум):</h2>`;

        // === НОВИЙ БЛОК: Збір людей та розподіл вартості кошиків за митними лімітами ===
    const people = [];
    document.querySelectorAll('#peopleTable tbody tr').forEach(row => {
        const nameInput = row.querySelector('td:first-child input');
        const name = nameInput ? (nameInput.value || "Людина") : "Людина";
        const freeLimit = parseFloat(row.querySelector('.free-limit').value) || 0;
        people.push({ name: name, initialFreeLimit: freeLimit, currentFreeLimit: freeLimit, assignedBoxes: [] });
    });

    // Створюємо копію результатів промокодів для логістичного розподілу сумарних вартостей
    let boxesToDistribute = bestPromosDistribution.map(p => ({
        promoName: p.name.toUpperCase(),
        cost: p.totalCost
    }));

    // Сортуємо кошики за вартістю (від найбільшої до найменшої) для кращого пакування на людей
    boxesToDistribute.sort((a, b) => b.cost - a.cost);

    // Жадібний алгоритм розподілу кошиків промокодів по вільних лімітах людей
    boxesToDistribute.forEach(box => {
        // Шукаємо людину, у якої вільний ліміт дозволяє прийняти цей кошик
        // Пріоритет віддаємо тому, у кого вільний ліміт після пакування залишиться мінімальним (або просто є місце)
        let bestPerson = null;
        let minRemainingLimit = Infinity;

        people.forEach(person => {
            if (person.currentFreeLimit >= box.cost) {
                let rem = person.currentFreeLimit - box.cost;
                if (rem < minRemainingLimit) {
                    minRemainingLimit = rem;
                    bestPerson = person;
                }
            }
        });

        if (bestPerson) {
            bestPerson.assignedBoxes.push(box);
            bestPerson.currentFreeLimit -= box.cost;
        } else {
            // Якщо жодна людина не має достатньо вільного ліміту для повноцінного кошика
            // Додаємо віртуальний статус "Переліміт / Потрібна нова людина"
            if (!window.unassignedBoxes) window.unassignedBoxes = [];
            window.unassignedBoxes.push(box);
        }
    });

    // 5. Рендеринг фінальних результатів у HTML

    bestPromosDistribution.forEach(p => {
        const counts = {};
        p.items.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + 1;
        });

        const promoBenefitPercent = p.totalCost > 0 ? (p.discount / p.totalCost) * 100 : 0;

        html += `<div style="margin-bottom: 15px; padding: 12px; border: 1px solid #ccc; background: #fafafa; border-left: 5px solid #2980b9;">`;
        html += `<h3>🎫 Промокод: <span style="color:#2980b9;">${p.name.toUpperCase()}</span></h3>`;
        html += `<ul>`;
        for (let prodName in counts) {
            const prodPrice = products.find(prod => prod.name === prodName).price;
            html += `<li>${prodName.toUpperCase()} — <b>${counts[prodName]} шт.</b> (Сума: ${(counts[prodName] * prodPrice).toFixed(2)})</li>`;
        }
        html += `</ul>`;
        html += `<b>Вартість товарів у кошику промокоду:</b> ${p.totalCost.toFixed(2)} (Необхідний поріг: ${p.threshold.toFixed(2)})<br>`;
        html += `<b>Знижка промокоду:</b> ${p.discount.toFixed(2)}<br>`;
        html += `<b>Відсоток вигоди кошика:</b> <mark><b>${promoBenefitPercent.toFixed(2)}%</b></mark>`;
        html += `</div>`;
    });

    // === НОВИЙ БЛОК HTML: Відображення митного розподілу по людях ===
    html += `<hr style="border: 1px dashed #d35400; margin-top: 20px;">`;
    html += `<h2>📦 Розподіл посилок (промокодів) по людях згідно з лімітами:</h2>`;

    let unassigned = [];
    people.forEach(person => {
        html += `<div style="margin-bottom: 15px; padding: 12px; border: 1px solid #ccc; background: #fffcf9; border-left: 5px solid #d35400;">`;
        html += `<h3>👤 Одержувач: <span style="color:#d35400;">${person.name}</span></h3>`;
        html += `• Стартовий вільний ліміт: <b>${person.initialFreeLimit.toFixed(2)} $</b><br>`;
        
        if (person.assignedBoxes.length === 0) {
            html += `<p style="color:#7f8c8d; font-style:italic; margin: 5px 0;">На цю людину не оформлено жодної посилки (немає потреби або замало ліміту)</p>`;
        } else {
            html += `<b>Призначені посилки за промокодами:</b><ul>`;
            person.assignedBoxes.forEach(box => {
                html += `<li>Кошик промокоду <b>${box.promoName}</b> — Сума: <b>${box.cost.toFixed(2)} $</b></li>`;
            });
            html += `</ul>`;
        }
        html += `• Залишок вільного ліміту після закупівлі: <span style="color:#27ae60; font-weight:bold;">${person.currentFreeLimit.toFixed(2)} $</span>`;
        html += `</div>`;
    });

    // Перевірка на посилки, які не влаштувалися через брак лімітів у людей
    boxesToDistribute.forEach(box => {
        let distributed = people.some(p => p.assignedBoxes.some(b => b.promoName === box.promoName));
        if (!distributed) unassigned.push(box);
    });

    if (unassigned.length > 0) {
        html += `<div style="margin-bottom: 15px; padding: 12px; border: 1px solid #e74c3c; background: #fdf2f2; border-left: 5px solid #e74c3c; color: #c0392b;">`;
        html += `<h3>⚠️ Увага! Наступні посилки ПЕРЕВИЩУЮТЬ ліміти наявних людей:</h3><ul>`;
        unassigned.forEach(box => {
            html += `<li>Кошик промокоду <b>${box.promoName}</b> (Сума: ${box.cost.toFixed(2)} $) — не знайшов одержувача з вільним лімітом!</li>`;
        });
        html += `</ul><p><b>Порада:</b> Додайте ще людей або зменшіть значення "В дорозі" для наявних одержувачів.</p>`;
        html += `</div>`;
    }

    // Загальний підсумок закупівлі (футер калькулятора)
    html += `<hr style="border: 1px dashed #34495e; margin-top: 20px;">`;
    html += `<div style="font-size: 18px; line-height: 1.6; background: #ebf5fb; padding: 15px; border-left: 5px solid #27ae60;">`;
    html += `📊 <b>ПІДСУМКИ ЗАКУПІВЛІ ЗА ВСІМА ПРОМОКОДАМИ:</b><br>`;
    html += `• Сумарна вартість усіх закуплених товарів: <b>${bestTotalCost.toFixed(2)} $</b> (Сумарний поріг використаних промокодів: ${totalThresholdRequired.toFixed(2)} $)<br>`;
    html += `• Сумарна знижка за всіма використаними промокодами: <b>${totalDiscountSum.toFixed(2)} $</b><br>`;
    html += `• 🏆 <b>ЗАГАЛЬНИЙ ВІДСОТОК ВИГОДИ (${totalDiscountSum.toFixed(2)} / ${bestTotalCost.toFixed(2)} * 100%):</b> <span style="font-size: 22px; color: #27ae60;"><b>${bestGlobalRatio.toFixed(2)}%</b></span>`;
    html += `</div>`;

    resultContent.innerHTML = html;
}
