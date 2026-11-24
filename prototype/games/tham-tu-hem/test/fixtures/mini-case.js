// Vụ mẫu TÍ HON để minh hoạ định dạng (difficulty 0 = chỉ dùng cho test; vụ thật dùng 1–3 và phải đủ lượng nội dung).
export default {
  id: "mini", no: 0, title: "Ổ Bánh Mì Mất Pate", tagline: "Pate đi đâu?", difficulty: 0,
  client: "chu",
  intro: [
    ["chu", "Thám tử ơi, ổ bánh mì của tui mất sạch [[pate]]!", "shock"],
    ["teo", "Chắc pate tự bỏ nhà đi đó sếp.", "smug"],
    ["me", "Tèo, im.", "neutral"],
  ],
  social: { group: "Hẻm 47 Hóng Biến", posts: [{ by: "batu", text: "Nóng: ổ bánh mì đầu hẻm bị rút ruột!", likes: 128, comments: [{ by: "teo", text: "Hóng thám tử nhà mình 🍿" }] }] },
  people: {
    chu: { name: "Chú Tư bánh mì", role: "Nạn nhân", bio: "Bán bánh mì 20 năm." },
    an: { name: "An", role: "Khách quen", bio: "Mê [[pate]].", suspect: true },
    binh: { name: "Bình", role: "Phụ bán", bio: "Ăn chay trường.", suspect: true },
  },
  locations: {
    xe: {
      name: "Xe bánh mì", scene: "cart", start: true,
      intro: [["narr", "Xe bánh mì còn thơm mùi bơ."]],
      hotspots: [
        { id: "hu-pate", label: "Hũ pate", rect: [300, 260, 80, 60], lines: [["me", "Hũ pate trống trơn, có dấu [[muong-nho|muỗng nhỏ]]."]], gives: { clues: ["muong"] } },
        { id: "ghe", label: "Ghế nhựa", rect: [600, 360, 90, 110], lines: [["teo", "Ghế này ngồi êm ghê sếp."]] },
        { id: "tui", label: "Túi của An", rect: [700, 300, 60, 60], needs: "stmt:an-khong-an", lines: [["me", "Trong túi có hộp [[sua-chua]] và cái muỗng dính pate."]], gives: { clues: ["muong-an"] } },
      ],
    },
  },
  clues: {
    muong: { name: "Muỗng nhỏ", desc: "Muỗng nhựa nhỏ dính [[pate]]." },
    "muong-an": { name: "Muỗng trong túi An", desc: "Cùng loại muỗng, ăn [[sua-chua]] xong múc pate." },
  },
  words: {
    pate: { text: "pate", kind: "vat" },
    "muong-nho": { text: "muỗng nhỏ", kind: "vat" },
    "sua-chua": { text: "sữa chua", kind: "vat" },
    an: { text: "An", kind: "ai" },
    binh: { text: "Bình", kind: "ai" },
  },
  talks: {
    an: [{ id: "pate", topic: "Em có ăn pate không?", lines: [["an", "Em đâu có ăn!", "nervous"]], gives: { stmts: ["an-khong-an"], words: ["an"] } }],
    binh: [{ id: "chay", topic: "Em ăn gì sáng nay?", lines: [["binh", "Em ăn chay mà anh.", "neutral"]], gives: { words: ["binh"] } }],
  },
  stmts: {
    "an-khong-an": { by: "an", text: "Em không hề đụng tới [[pate]].", break: { clue: "muong-an", lines: [["an", "Thôi… em múc có ba muỗng!", "shock"]], gives: { flags: ["an-nhan"] } } },
  },
  present: { binh: { muong: [["binh", "Muỗng này người ăn chay không xài đâu anh.", "smug"]] } },
  wrong: { an: [[["an", "Cái đó thì liên quan gì em?", "angry"]]], binh: [[["binh", "Anh soi kỹ lại đi.", "neutral"]]] },
  deduction: [{ id: "ai", text: "Người ăn pate là {a}.", blanks: { a: { answer: "an", kind: "ai" } }, explain: [["me", "Muỗng trong túi An nói hết."]] }],
  finale: {
    culprit: "an", intro: [["me", "An, em còn gì để nói?"]],
    steps: [{ claim: [["an", "Muỗng đó ai xài chẳng được!", "angry"]], answer: "muong-an", right: [["an", "…", "shock"]], wrong: [["an", "Hehe, trật rồi.", "smug"]] }],
    confess: [["an", "Pate chú Tư ngon quá…", "nervous"]], epilogue: [["chu", "Mai bán thêm pate cho em!", "happy"]],
    comments: [{ by: "Hùng Xe Ôm", text: "Pate chú Tư đỉnh thiệt", likes: 42 }],
  },
  hints: [{ needs: { any: ["stmt:an-khong-an"] }, text: "An nói không ăn pate, sếp soi lại xe bánh mì xem." }, { text: "Hỏi An xem." }],
  bonus: [{ id: "b1", q: "Bình ăn gì?", choices: ["Chay", "Pate"], answer: 0, explain: "Bình ăn chay." }],
};
