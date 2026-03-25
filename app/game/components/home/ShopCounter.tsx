"use client";

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
}

interface ShopCounterProps {
  isArtisane: boolean; // artisane sets prices, paladin buys
  shopInventory: ShopItem[];
  playerSous: number;
  inventory: { id: string; qty: number }[];
  // Artisane actions
  onSetForSale: (itemId: string, price: number) => void;
  onRemoveFromSale: (itemId: string) => void;
  // Paladin actions
  onBuy: (itemId: string, price: number) => void;
  onClose: () => void;
}

export function ShopCounter({ isArtisane, shopInventory, playerSous, inventory, onSetForSale, onRemoveFromSale, onBuy, onClose }: ShopCounterProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel-opening" style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 14, padding: 16, maxWidth: 360, width: "92%",
        maxHeight: "85vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#3D2B1F" }}>🏪 Comptoir</div>
          <button onClick={onClose} style={{ background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 6, padding: "4px 10px", fontSize: 14, cursor: "pointer" }}>❌</button>
        </div>

        <div style={{ fontSize: 11, color: "#5C4033", textAlign: "center", marginBottom: 10 }}>
          {isArtisane ? "Mettez vos créations en vente" : `☀️ ${playerSous} Sous disponibles`}
        </div>

        {/* Items for sale */}
        {shopInventory.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#888", fontSize: 12 }}>
            {isArtisane ? "Rien en vente. Craftez et ajoutez !" : "Rien en vente pour le moment."}
          </div>
        ) : (
          shopInventory.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", marginBottom: 6, borderRadius: 8,
              background: "rgba(218,165,32,0.1)", border: "1px solid rgba(218,165,32,0.3)",
            }}>
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{item.name} ×{item.qty}</div>
                <div style={{ fontSize: 11, color: item.price === 0 ? "#4CAF50" : "#DAA520" }}>
                  {item.price === 0 ? "GRATUIT" : `☀️ ${item.price}`}
                </div>
              </div>
              {isArtisane ? (
                <button onClick={() => onRemoveFromSale(item.id)} style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 10,
                  background: "#D94F4F", color: "#FFF", border: "none", cursor: "pointer",
                }}>Retirer</button>
              ) : (
                <button onClick={() => onBuy(item.id, item.price)} disabled={playerSous < item.price} style={{
                  padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: "bold",
                  background: playerSous >= item.price ? "#4CAF50" : "#888",
                  color: "#FFF", border: "none", cursor: playerSous >= item.price ? "pointer" : "default",
                }}>Acheter</button>
              )}
            </div>
          ))
        )}

        {/* Artisane: add items for sale */}
        {isArtisane && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#3D2B1F", marginBottom: 6 }}>Ajouter en vente :</div>
            <div style={{ fontSize: 9, color: "#888", marginBottom: 6 }}>Potions = gratuites (deal du couple). Sorts/armes/plats = vous fixez le prix.</div>
            {inventory.filter(i => ["potion", "potion_plus", "ragout", "bouillon", "infusion"].includes(i.id)).map(item => (
              <button key={item.id} onClick={() => onSetForSale(item.id, item.id.includes("potion") ? 0 : 25)} style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                padding: "6px 10px", marginBottom: 4, borderRadius: 6,
                background: "linear-gradient(135deg, #6B8E23, #556B2F)",
                color: "#FFF", border: "1px solid #3D5E1A", cursor: "pointer", fontSize: 11,
              }}>
                + {item.id} ×{item.qty}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
