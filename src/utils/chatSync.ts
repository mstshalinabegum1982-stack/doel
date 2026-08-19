import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

export async function syncOrderToSiteChat(
  db: any,
  userId: string,
  orderId: string,
  productName: string,
  productImage: string,
  quantity: number,
  totalPrice: number,
  customerName: string,
  chatSourceId: string,
  storeName: string
) {
  try {
    const keyToken = `chat_customer_token_${chatSourceId}`;
    const keyName = `chat_customer_name_${chatSourceId}`;
    
    let token = localStorage.getItem(keyToken);
    if (!token) {
      // Generate a new customer token if one doesn't exist yet
      token = 'cust_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem(keyToken, token);
      localStorage.setItem(keyName, customerName);
    }

    const docRef = doc(db, 'site_chats', token);
    const docSnap = await getDoc(docRef);
    
    const orderDetailsMsgText = `📦 New order placed successfully!\n\nProduct: ${productName}\nQuantity: ${quantity || 1} pcs\nTotal Price: ৳${totalPrice}\nCustomer Name: ${customerName}\nOrder ID: #${orderId.substring(0, 8).toUpperCase()}`;
    
    const newOrderMsg = {
      id: `msg-order-${orderId}`,
      sender: 'customer',
      role: 'customer',
      text: orderDetailsMsgText,
      image: productImage || '', // Store the product image so it displays directly in the chatbot / admin message feed!
      timestamp: new Date().toISOString()
    };

    let existingMessages = [];
    if (docSnap.exists()) {
      existingMessages = docSnap.data().messages || [];
    }

    // Append message only if not already duplicated
    if (!existingMessages.some((m: any) => m.id === newOrderMsg.id)) {
      existingMessages.push(newOrderMsg);
    }

    // Clean any potentially undefined values
    const cleanedPayload: any = {
      customerName: customerName || 'Anonymous Customer',
      customerToken: token,
      userId: userId,
      chatSourceId: chatSourceId,
      chatSourceTitle: storeName || 'DOELpro Store',
      messages: existingMessages,
      lastMessageAt: new Date().toISOString(),
      unreadForAdmin: true,
      unreadForCustomer: false
    };

    await setDoc(docRef, cleanedPayload, { merge: true });

  } catch (err) {
    console.error('Error syncing order to site chat:', err);
  }
}
