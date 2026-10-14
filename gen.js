// けいさんどうじょう：ステップ定義と問題の自動生成
// 問題の形
//  op     : a op b = □            (a,b は数・小数文字列・分数{n,d})
//  blank  : a × □ = c / □ × b = c
//  rem    : a ÷ b = □ あまり □
//  hissan : 筆算（rows = 答えを書く行の数）
(function (root) {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function addCarries(a, b) {
    let c = 0, n = 0;
    while (a > 0 || b > 0) {
      const s = a % 10 + b % 10 + c;
      c = s >= 10 ? 1 : 0; n += c;
      a = Math.floor(a / 10); b = Math.floor(b / 10);
    }
    return n;
  }
  function subBorrows(a, b) {
    let br = 0, n = 0;
    while (a > 0 || b > 0) {
      const d = a % 10 - b % 10 - br;
      br = d < 0 ? 1 : 0; n += br;
      a = Math.floor(a / 10); b = Math.floor(b / 10);
    }
    return n;
  }
  function mulCarries(a, m) {
    let c = 0, n = 0;
    while (a > 0) {
      c = Math.floor(((a % 10) * m + c) / 10);
      if (c > 0) n++;
      a = Math.floor(a / 10);
    }
    return n;
  }
  // 小数は 10倍した整数で持つ（0.3 → 3）
  const dec = x => `${Math.floor(x / 10)}.${x % 10}`;
  const decAns = x => (x % 10 === 0 ? String(x / 10) : dec(x));

  const op = (a, o, b, ans) => ({ t: 'op', a, o, b, ans });
  const hs = (a, o, b, ans, rows = 1) => ({ t: 'hissan', a: String(a), o, b: String(b), ans: String(ans), rows });

  // ---- 各ステップの問題1問をつくる関数 ----
  const kuku = (lo, hi) => () => { const a = R(lo, hi), b = R(1, 9); return op(a, '×', b, a * b); };
  const waru = (lo, hi) => () => { const d = R(lo, hi), q = R(1, 9); return op(d * q, '÷', d, q); };
  const amari = (lo, hi, zeroRate) => () => {
    const d = R(lo, hi), q = R(1, 9);
    const r = Math.random() < zeroRate ? 0 : R(1, d - 1);
    return { t: 'rem', a: d * q + r, b: d, ans: `${q} あまり ${r}`, q, r };
  };
  function threeDigitAdd(test) {
    return () => { for (;;) { const a = R(100, 899), b = R(100, 899); if (test(a, b)) return hs(a, '+', b, a + b); } };
  }
  function threeDigitSub(test) {
    return () => { for (;;) { const a = R(200, 999), b = R(100, a - 1); if (test(a, b)) return hs(a, '−', b, a - b); } };
  }

  const STEPS = [
    // 1 かけ算
    { id: 'A1', unit: 'かけ算', title: '九九（2〜5のだん）', n: 30, goal: 3, gen: kuku(2, 5) },
    { id: 'A2', unit: 'かけ算', title: '九九（6〜9のだん）', n: 30, goal: 3, gen: kuku(6, 9) },
    { id: 'A3', unit: 'かけ算', title: '九九（ぜんぶのだん）', n: 30, goal: 3, gen: kuku(1, 9) },
    { id: 'A4', unit: 'かけ算', title: '0や10のかけ算', n: 30, goal: 3, gen: () => {
      const n = R(1, 9);
      switch (R(0, 4)) {
        case 0: return op(0, '×', n, 0);
        case 1: return op(n, '×', 0, 0);
        case 2: return op(10, '×', n, 10 * n);
        case 3: return op(n, '×', 10, 10 * n);
        default: { const a = R(2, 9), b = R(2, 9); return op(a, '×', b, a * b); }
      }
    } },
    { id: 'A5', unit: 'かけ算', title: '□にあてはまる数', n: 30, goal: 4, gen: () => {
      const a = R(2, 9), b = R(2, 9);
      return Math.random() < 0.5 ? { t: 'blank', left: a, right: null, c: a * b, ans: b }
                                 : { t: 'blank', left: null, right: b, c: a * b, ans: a };
    } },
    // 2 わり算
    { id: 'B1', unit: 'わり算', title: 'わり算（÷2〜÷5）', n: 30, goal: 4, gen: waru(2, 5) },
    { id: 'B2', unit: 'わり算', title: 'わり算（÷6〜÷9）', n: 30, goal: 4, gen: waru(6, 9) },
    { id: 'B3', unit: 'わり算', title: 'わり算（ぜんぶ）', n: 30, goal: 4, gen: waru(2, 9) },
    { id: 'B4', unit: 'わり算', title: '0や1のわり算', n: 30, goal: 4, gen: () => {
      const n = R(1, 9);
      switch (R(0, 3)) {
        case 0: return op(0, '÷', n, 0);
        case 1: return op(n, '÷', n, 1);
        case 2: return op(n, '÷', 1, n);
        default: return waru(2, 9)();
      }
    } },
    // 3 たし算とひき算の筆算
    { id: 'C1', unit: 'たし算とひき算の筆算', title: '3けたのたし算（くり上がりなし）', n: 12, goal: 6, gen: threeDigitAdd((a, b) => addCarries(a, b) === 0) },
    { id: 'C2', unit: 'たし算とひき算の筆算', title: '3けたのたし算（くり上がり1回）', n: 12, goal: 7, gen: threeDigitAdd((a, b) => addCarries(a, b) === 1 && a + b < 1000) },
    { id: 'C3', unit: 'たし算とひき算の筆算', title: '3けたのたし算（くり上がり2回）', n: 12, goal: 8, gen: threeDigitAdd((a, b) => addCarries(a, b) >= 2) },
    { id: 'C4', unit: 'たし算とひき算の筆算', title: '3けたのひき算（くり下がりなし）', n: 12, goal: 6, gen: threeDigitSub((a, b) => subBorrows(a, b) === 0) },
    { id: 'C5', unit: 'たし算とひき算の筆算', title: '3けたのひき算（くり下がり1回）', n: 12, goal: 7, gen: threeDigitSub((a, b) => subBorrows(a, b) === 1) },
    { id: 'C6', unit: 'たし算とひき算の筆算', title: '3けたのひき算（くり下がり2回・0がある数）', n: 12, goal: 8, gen: () => {
      for (;;) {
        const a = Math.random() < 0.4 ? R(2, 9) * 100 + R(1, 9) : R(200, 999);
        const b = R(100, a - 1);
        if (a > b && subBorrows(a, b) >= 2) return hs(a, '−', b, a - b);
      }
    } },
    { id: 'D1', unit: 'たし算とひき算の筆算', title: 'あんざん（2けた＋2けた）', n: 20, goal: 5, gen: () => {
      for (;;) { const a = R(11, 89), b = R(11, 89); if (addCarries(a, b) === 1 && a + b < 100) return op(a, '+', b, a + b); }
    } },
    { id: 'D2', unit: 'たし算とひき算の筆算', title: 'あんざん（2けた−2けた）', n: 20, goal: 5, gen: () => {
      for (;;) { const a = R(21, 99), b = R(11, a - 1); if (subBorrows(a, b) === 1) return op(a, '−', b, a - b); }
    } },
    // 4 あまりのあるわり算
    { id: 'E1', unit: 'あまりのあるわり算', title: 'あまりのあるわり算（÷2〜÷5）', n: 30, goal: 6, gen: amari(2, 5, 0) },
    { id: 'E2', unit: 'あまりのあるわり算', title: 'あまりのあるわり算（÷6〜÷9）', n: 30, goal: 6, gen: amari(6, 9, 0) },
    { id: 'E3', unit: 'あまりのあるわり算', title: 'あまりがある・ない まぜこぜ', n: 30, goal: 6, gen: amari(2, 9, 0.3) },
    // 5 大きい数
    { id: 'F1', unit: '大きい数', title: '何十・何百のかけ算（30×4 など）', n: 30, goal: 4, gen: () => {
      const m = R(2, 9);
      return Math.random() < 0.6 ? (k => op(k * 10, '×', m, k * 10 * m))(R(1, 9))
                                 : (k => op(k * 100, '×', m, k * 100 * m))(R(1, 9));
    } },
    { id: 'F2', unit: '大きい数', title: '10倍・100倍・10でわる', n: 30, goal: 4, gen: () => {
      switch (R(0, 2)) {
        case 0: { const n = R(2, 99); return op(n, '×', 10, n * 10); }
        case 1: { const n = R(2, 99); return op(n, '×', 100, n * 100); }
        default: { const n = R(2, 99); return op(n * 10, '÷', 10, n); }
      }
    } },
    { id: 'C7', unit: '大きい数', title: '4けたのたし算・ひき算', n: 12, goal: 9, gen: () => {
      for (;;) {
        if (Math.random() < 0.5) { const a = R(1000, 8999), b = R(100, 9999 - a); if (a + b < 10000 && addCarries(a, b) >= 1) return hs(a, '+', b, a + b); }
        else { const a = R(1000, 9999), b = R(100, a - 1); if (subBorrows(a, b) >= 1) return hs(a, '−', b, a - b); }
      }
    } },
    // 6 かけ算の筆算(1)
    { id: 'G1', unit: 'かけ算の筆算', title: '2けた×1けた（くり上がりなし）', n: 12, goal: 5, gen: () => {
      for (;;) { const a = R(11, 99), m = R(2, 4); if (a % 10 !== 0 && mulCarries(a, m) === 0) return hs(a, '×', m, a * m); }
    } },
    { id: 'G2', unit: 'かけ算の筆算', title: '2けた×1けた（くり上がり1回）', n: 12, goal: 6, gen: () => {
      for (;;) { const a = R(11, 49), m = R(2, 9); if (a % 10 * m >= 10 && a * m < 100) return hs(a, '×', m, a * m); }
    } },
    { id: 'G3', unit: 'かけ算の筆算', title: '2けた×1けた（答えが3けた）', n: 12, goal: 7, gen: () => {
      for (;;) { const a = R(12, 99), m = R(2, 9); if (a * m >= 100 && a % 10 !== 0) return hs(a, '×', m, a * m); }
    } },
    { id: 'G4', unit: 'かけ算の筆算', title: '3けた×1けた', n: 12, goal: 8, gen: () => {
      for (;;) { const a = R(101, 499), m = R(2, 9); if (a * m < 1000 && a % 10 !== 0 && mulCarries(a, m) >= 1) return hs(a, '×', m, a * m); }
    } },
    { id: 'G5', unit: 'かけ算の筆算', title: '3けた×1けた（答えが4けた・0がある数）', n: 12, goal: 9, gen: () => {
      for (;;) {
        const a = Math.random() < 0.4 ? R(1, 9) * 100 + R(1, 9) : R(102, 999), m = R(2, 9);
        if (a * m >= 1000 && a % 10 !== 0) return hs(a, '×', m, a * m);
      }
    } },
    // 7 大きい数のわり算
    { id: 'K1', unit: '大きい数のわり算', title: '何十・何百÷1けた（60÷3 など）', n: 20, goal: 4, gen: () => {
      for (;;) { const t = R(2, 9), d = R(2, 9), k = Math.random() < 0.6 ? 10 : 100; if (t % d === 0) return op(t * k, '÷', d, t * k / d); }
    } },
    { id: 'K2', unit: '大きい数のわり算', title: '2けた÷1けた（69÷3 など）', n: 20, goal: 5, gen: () => {
      for (;;) { const t = R(1, 9), o = R(1, 9), d = R(2, 9); if (t % d === 0 && o % d === 0) return op(t * 10 + o, '÷', d, (t * 10 + o) / d); }
    } },
    // 8 小数
    { id: 'H1', unit: '小数', title: '0.1のいくつ分（0.3＋0.4 など）', n: 30, goal: 4, gen: () => {
      switch (R(0, 2)) {
        case 0: { const a = R(1, 9), b = R(1, 10 - a); return op(dec(a), '+', dec(b), decAns(a + b)); }
        case 1: { const a = R(2, 9), b = R(1, a - 1); return op(dec(a), '−', dec(b), decAns(a - b)); }
      }
      const a = R(1, 9); return op(1, '−', dec(a), decAns(10 - a));
    } },
    { id: 'H2', unit: '小数', title: '小数のたし算・ひき算（くり上がりなし）', n: 30, goal: 5, gen: () => {
      for (;;) {
        const a = R(11, 99), b = R(11, 99);
        if (a % 10 === 0 || b % 10 === 0) continue;
        if (Math.random() < 0.5) { if (addCarries(a, b) === 0) return op(dec(a), '+', dec(b), decAns(a + b)); }
        else if (a > b && subBorrows(a, b) === 0) return op(dec(a), '−', dec(b), decAns(a - b));
      }
    } },
    { id: 'H3', unit: '小数', title: '小数の筆算（くり上がり・くり下がりあり）', n: 12, goal: 8, gen: () => {
      for (;;) {
        const a = R(11, 199), b = R(11, 199);
        if (a % 10 === 0 || b % 10 === 0) continue;
        if (Math.random() < 0.5) { if (addCarries(a, b) >= 1) return hs(dec(a), '+', dec(b), decAns(a + b)); }
        else if (a > b && subBorrows(a, b) >= 1) return hs(dec(a), '−', dec(b), decAns(a - b));
      }
    } },
    // 9 分数
    { id: 'I1', unit: '分数', title: '分数のたし算', n: 20, goal: 5, gen: () => {
      const d = R(3, 10), a = R(1, d - 1), b = R(1, d - a);
      return op({ n: a, d }, '+', { n: b, d }, a + b === d ? 1 : { n: a + b, d });
    } },
    { id: 'I2', unit: '分数', title: '分数のひき算', n: 20, goal: 5, gen: () => {
      const d = R(3, 10);
      if (Math.random() < 0.3) { const a = R(1, d - 1); return op(1, '−', { n: a, d }, { n: d - a, d }); }
      const a = R(2, d - 1), b = R(1, a - 1); return op({ n: a, d }, '−', { n: b, d }, { n: a - b, d });
    } },
    // 10 かけ算の筆算(2)
    { id: 'J1', unit: 'かけ算の筆算 (2)', title: '何十をかける（23×30 など）', n: 20, goal: 5, gen: () => {
      const a = R(11, 49), m = R(2, 9) * 10; return a % 10 === 0 ? op(a + 1, '×', m, (a + 1) * m) : op(a, '×', m, a * m);
    } },
    { id: 'J2', unit: 'かけ算の筆算 (2)', title: '2けた×2けた', n: 8, goal: 10, gen: () => {
      for (;;) { const a = R(12, 98), b = R(12, 98); if (a % 10 && b % 10 && b % 10 !== 1) return hs(a, '×', b, a * b, 3); }
    } },
    { id: 'J3', unit: 'かけ算の筆算 (2)', title: '3けた×2けた', n: 6, goal: 10, gen: () => {
      for (;;) { const a = R(102, 899), b = R(12, 98); if (a % 10 && b % 10 && b % 10 !== 1) return hs(a, '×', b, a * b, 3); }
    } },
  ];

  const keyOf = p => JSON.stringify([p.t, p.a, p.o, p.b, p.left, p.right, p.c]);

  function makeSheet(step) {
    const seen = new Set(), list = [];
    let tries = 0;
    while (list.length < step.n && tries < step.n * 500) {
      tries++;
      const p = step.gen();
      const k = keyOf(p);
      if (seen.has(k)) continue;
      seen.add(k); list.push(p);
    }
    // 重ならない問題が足りないときは重複を許して埋める
    while (list.length < step.n) list.push(step.gen());
    return list;
  }

  const api = { STEPS, makeSheet, addCarries, subBorrows, mulCarries };
  if (typeof module !== 'undefined') module.exports = api; else root.KeisanGen = api;
})(this);
