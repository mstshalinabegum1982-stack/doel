import { Order } from '../types';

export type ExtendedOrder = Order & {
  totalAmount?: number;
  advancePaymentAmount?: number;
  discountAmount?: number;
};

/**
 * Calculates comprehensive financial & profit metrics for an order
 */
export function getOrderFinances(o: Partial<ExtendedOrder> | undefined | null) {
  if (!o) {
    return {
      itemTotal: 0,
      total: 0,
      advance: 0,
      discount: 0,
      due: 0,
      buyPriceTotal: 0,
      sellPriceTotal: 0,
      profit: 0
    };
  }

  const profitFinances = getOrderProfitFinances(o);

  const itemTotal = (o.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  const total = o.totalAmount ?? itemTotal;
  const advance = o.advancePaymentAmount || 0;
  const discount = o.discountAmount || 0;
  const due = Math.max(0, total - advance - discount);

  return {
    itemTotal,
    total,
    advance,
    discount,
    due,
    ...profitFinances
  };
}

/**
 * Calculates profit and cost breakdown for an order
 */
export function getOrderProfitFinances(o: Partial<ExtendedOrder> | undefined | null) {
  if (!o) {
    return { buyPriceTotal: 0, sellPriceTotal: 0, profit: 0 };
  }

  if (o.items && o.items.length > 0) {
    let totalSales = 0;
    let totalCost = 0;
    for (const item of o.items) {
      const itemQty = Number(item.quantity) || 1;
      const itemSell = Number(item.sellPrice || item.price || 0);
      const itemBuy = Number(item.buyPrice || 0);
      totalSales += itemSell * itemQty;
      totalCost += itemBuy * itemQty;
    }
    const profit = totalSales - totalCost;
    return {
      buyPriceTotal: totalCost,
      sellPriceTotal: totalSales,
      profit
    };
  } else {
    const qty = Number(o.quantity) || 1;
    const sellPrice = Number(o.sellPrice) || 0;
    const buyPrice = Number(o.buyPrice) || 0;

    const isPreMultiplied = o.productName?.startsWith('Shopping cart with');
    if (isPreMultiplied) {
      return {
        buyPriceTotal: buyPrice,
        sellPriceTotal: sellPrice,
        profit: sellPrice - buyPrice
      };
    } else {
      return {
        buyPriceTotal: buyPrice * qty,
        sellPriceTotal: sellPrice * qty,
        profit: (sellPrice - buyPrice) * qty
      };
    }
  }
}
