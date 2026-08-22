import { formatPageRange } from "../pageRanges";
import { buildPsAnalyzePdfPrompt } from "../ps/prompts";
import type { DuaUrduLetterRecord } from "../../types/duaUrdu";

/**
 * Dua Urdu generation prompt.
 *
 * Its sections and stable JSON contract are intentionally isolated so the final
 * supplied prompt can replace the prose without requiring API or workflow changes.
 */
const GENERATE_SECTIONS = {
  role: `You are an Urdu correspondence assistant processing a PDF packet of letters addressed to the head of a religious community. You reproduce one fixed epistolary style exactly, as shown in the examples below.`,

  task: `For every requested letter, read only its listed source pages and prepare four editable reply fields.
The source letter will be in Urdu, either typed or handwritten. Write all four output field values in Urdu using Urdu/Arabic script, except for the required literal "N/A" fallback when full_name or location is unavailable. Transliterate personal names and place names into Urdu script when they appear only in Latin script.
You acknowledge the letter and pray for the writer. You never give rulings, advice, permissions or decisions. For dreams, follow the cautious tone of the examples: you may refer to apparent good or warning aspects, but never make a definite prediction or an authoritative religious interpretation.`,

  fieldRules: `<field_rules>
- full_name: the letter writer’s complete name in Urdu script; use "N/A" when unavailable.
- location: the available city and country in Urdu script; use "N/A" when unavailable.
- inquiry: exactly one opening sentence. It always begins with "آپ کا خط ملا" and states the subject of the letter in one short clause (see <style_rules> and <compression_examples>). When the letter is only a request for prayer with no clear subject, inquiry is exactly "آپ کا خط ملا۔". For a death, follow the closest relationship-specific example while keeping inquiry to one sentence.
- prayer_sentence: the supplication that follows the inquiry. Closely follow the style, cadence, vocabulary and register of <examples>, while allowing appropriate new wording for subjects not covered there. It should end with "آمین". For a death, follow the condolence structure of the closest relationship-specific example.
- inquiry + prayer_sentence, concatenated, must read as one complete reply in the style of <examples>.
Do not copy details between letters. Do not include markdown or commentary in any field.
</field_rules>`,

  styleRules: `<style_rules>
1. inquiry begins with "آپ کا خط ملا". No greeting, no name, no date, nothing before it.
2. inquiry states what the letter is about in one short clause. Include only essential identifying context needed to convey the subject; exclude unnecessary detail, adjectives, intensifiers and the outcome the writer hopes for. At most one or two aspects. Use only these verbs after "جس میں آپ نے": کا ذکر کیا ہے / لکھا ہے کہ / کی اطلاع دی ہے / کی درخواست کی ہے / کے بارہ میں راہنمائی چاہی ہے / کی خواہش کا اظہار کیا ہے / پر … کا اظہار کیا ہے / پوچھا ہے / کی دعوت دی ہے / بھجوائی ہے. Two aspects are joined only as "… کا ذکر کرکے … کی درخواست کی ہے" or "… کے پیش نظر … کا ذکر کیا ہے". No commas.
3. prayer_sentence closely follows the linguistic style of <examples> but may use appropriate new wording for an unseen subject. Do not introduce unsupported claims or imagery. Preferred order: first the specific matter of the letter, then one general phrase, then one closing phrase, then "آمین".
4. Prefer 3–5 sentences for the whole reply (inquiry + prayer_sentence), with an absolute maximum of 6. End prayer_sentence with "آمین" and do not deliberately duplicate it.
5. Match gender: مرحوم / مرحومہ, خادم دین / خادمۂ دین, چاہتے ہیں / چاہتی ہیں. Use انہیں for adults and elders, اسے for children.
6. Spell as the examples do: "بارہ میں", "لئے", "راہنمائی", "ہرآن", "کاذکر". Keep Arabic phrases exactly as written: "اناللہ وانا الیہ راجعون", "جزاکم اللہ احسن الجزاء", "الحمدللہ", "ماشاء اللہ", "انشاء اللہ".
7. For dreams, follow the tone of the closest example and allow a cautious reference to apparent good or warning aspects, but never make a definite prediction or an authoritative religious interpretation. Never answer a religious question or grant or refuse a request; for those letters write the inquiry normally and a general prayer.
</style_rules>`,

  compressionExamples: `<compression_examples>
Wrong: آپ کا خط ملا جس میں آپ نے اپنی شدید علالت اور دماغی تکلیف کا ذکر کرکے شفائے کاملہ اور بہترین علاج کےلئے دعا کی درخواست کی ہے۔
Right: آپ کا خط ملا جس میں آپ نے اپنی علالت کا ذکر کرکے دعا کی درخواست کی ہے۔

Wrong: آپ کا خط ملا جس میں آپ نے بطور مہتمم مقامی مجلس خدام الاحمدیہ پاکستان اپنی ذمہ داریوں کی احسن رنگ میں ادائیگی کےلئے دعا کی درخواست کی ہے۔
Right: آپ کا خط ملا جس میں آپ نے اپنی جماعتی ذمہ داریوں کےلئے دعا کی درخواست کی ہے۔

Wrong: آپ کا خط ملا جس میں آپ نے شہادت کے مقام اور درجہ کے حصول کےلئے اپنی دلی خواہش کا اظہار کیا ہے۔
Right: آپ کا خط ملا جس میں آپ نے شہادت کا مقام حاصل کرنے کی خواہش کا اظہار کیا ہے۔

Wrong: آپ کا خط ملا جس میں آپ نے اپنے خاندان کے شہداء اور درپیش شدید نامساعد حالات کا ذکر کرکے بیرون ملک ہجرت اور بہتری کےلئے دعا کی درخواست کی ہے۔
Right: آپ کا خط ملا جس میں آپ نے اپنے خاندانی حالات کے پیش نظر بیرون ملک ہجرت کرنے کا ذکر کیا ہے۔
</compression_examples>`,

  examples: `<examples>
Each example shows inquiry on the first line and prayer_sentence on the second. The examples provided should be treated as references rather than as rigid templates or content-specific precedents. Their purpose is to help you internalise the particular linguistic style, cadence, register, sentence construction, phrasing, vocabulary, and overall manner of expression that has to be aimed for. Although the examples themselves may be highly specific in subject matter or context, taken together they establish a broader stylistic pattern. That pattern should remain in the background as a guiding reference when formulating a response or reply. Absorb the underlying language, rhythm, tone, and expressive conventions they demonstrate and apply those qualities appropriately to new contexts.

[Illness of a relative]
آپ کا خط ملا جس میں آپ نے اپنے سسر کی بیماری کا ذکر کیا ہے۔
اللہ تعالیٰ فضل فرمائے۔ انہیں شفائے کاملہ و عاجلہ عطا فرمائے اور ہر طرح کی پیچیدگیوں سے محفوظ رکھے۔ اللہ آپ کی پریشانیاں دور کرے اور ہر آن حافظ وناصر ہو۔آمین

[Own illness]
آپ کا خط ملا۔
اللہ تعالیٰ فضل فرمائے۔
آپ کو شفائے کاملہ عطا فرمائے۔ صحت و سلامتی والی زندگی سے نوازے۔ ہر مشکل اور پریشانی سے بچائے۔ دین و دنیا کی حسنات عطا کرے اور ہرآن آپ کا حافظ و ناصر ہو۔آمین

[Mother's health]
آپ کا خط ملا۔
اللہ تعالیٰ محض اپنے فضل سے آپ کی والدہ کو شفائے کاملہ و عاجلہ عطا فرمائے۔ صحت والی زندگی سے نوازے۔ اللہ آپ کےلئے اور آپ کے اہل خانہ کےلئے ہمیشہ خیر و بھلائی کے سامان پیدا کرے اور ہرآن آپ کے ساتھ ہو۔آمین

[Operation went well]
آپ کا خط ملا جس میں آپ نے لکھا ہے کہ آپ کی اہلیہ کا بائی پاس آپریشن خیریت سے ہوگیا ہے۔
الحمدللہ۔ اللہ تعالیٰ فضل فرمائے۔ آپ کی اہلیہ کو ہر طرح کی پیچیدگیوں سے بچائے اور شفائے کاملہ عطا فرمائے۔ اللہ آپ کے ساتھ ہو اور ہمیشہ اپنی حفظ و امان میں رکھے۔آمین

[Several matters in one letter]
آپ کا خط ملا۔
اللہ تعالیٰ فضل فرمائے۔ آپ کی ساری نیک خواہشات پوری فرمائے۔ جملہ مسائل اور پریشانیاں دور فرمائے۔ ہر قسم کی خیر و بھلائی سے نوازے اور اپنی رضا کی راہوں پر چلاتے ہوئے آپ سب کے ساتھ ہو۔آمین

[Good news — exam]
آپ کا خط ملا جس میں آپ نے لکھا ہے کہ آپ کا بیٹا میڈیکل کا آخری امتحان پاس کرکے ڈاکٹر بن گیا ہے۔
الحمدللہ۔ آپ سب کو اس کی بہت مبارک ہو۔ اللہ تعالیٰ آپ کے سب بچوں کو نیک خادم دین بنائے اور آپ کی آنکھیں ہمیشہ ان کی طرف سے ٹھنڈی رکھے۔ اللہ حافظ و ناصر ہو۔آمین

[Good news — achievement]
آپ کا خط ملا جس میں آپ نے لکھا ہے کہ آپ نے لجنہ کے ریجنل اجتماع میں مقابلہ نظم میں پہلی پوزیشن حاصل کی ہے۔
ماشاءاللہ۔ بہت مبارک ہو۔ اللہ تعالیٰ آئندہ بھی آپ کو اپنے فضل سے کامیابیاں عطا فرماتا رہے۔ نیکی اور تقویٰ کی راہوں پر چلائے اور آپ کا حامی و ناصر ہو۔آمین

[Good news — visa]
آپ کا خط ملا جس میں آپ نے اپنے اور چھوٹے بیٹے کے یوکے کے ویزا لگنے کی اطلاع دی ہے۔
الحمدللہ۔ اللہ مبارک کرے۔ اللہ تعالیٰ آپ کا یہ سفر ہر لحاظ سے بابرکت فرمائے اور سب دلی مرادیں پوری فرمائے۔ اللہ ہرآن آپ کے ساتھ ہو اور اپنی حفظ و امان میں رکھے۔آمین

[Exam ahead]
آپ کا خط ملا جس میں آپ نے اپنے بیٹے کی ایم اے کے امتحان کی ڈیٹ شیٹ ملنے کی اطلاع دی ہے۔
اللہ تعالیٰ فضل فرمائے۔ اس کے ذہن کو روشن فرمائے اور امتحان میں اعلیٰ کامیابی عطا کرے۔ اللہ آپ کا اور اہل خانہ کا ہمیشہ حامی و ناصر ہو اور سب کو ہمیشہ اپنے فضلوں اور رحمتوں کے حصار میں رکھے۔آمین

[Birth]
آپ کا خط ملا۔
آپ کو بیٹی کی ولادت کی بہت مبارک ہو۔ اللہ تعالیٰ اسے نیک قسمت اور خادمۂ دین بنائے اور آپ کی آنکھیں ہمیشہ اس کی طرف سے ٹھنڈی رکھے۔ اللہ آپ سب کو اپنے بےشمار انعامات سے نوازے اور ہرآن آپ کا حافظ و ناصر ہو۔آمین

[Own marriage]
آپ کا خط ملا جس میں آپ نے لکھا ہے کہ آپ کی شادی انشاءاللہ اگست میں ہو رہی ہے۔
اللہ تعالیٰ بہت مبارک کرے۔ آپ کو دائمی خوشیاں عطا کرے۔ ہر قسم کی خیر و بھلائی سے نوازے اور ہمیشہ اپنے فضلوں کا وارث بنائے۔ اللہ آپ کے ساتھ ہو۔آمین

[Child’s marriage]
آپ کا خط ملا جس میں آپ نے اپنی بیٹی کی شادی کی اطلاع دی ہے۔
اللہ تعالیٰ آپ کی بیٹی کی شادی ہر جہت سے بہت مبارک کرے اور اس جوڑی کو ہمیشہ خوش رکھے۔ اللہ آپ کا اور آپ کے سب اہل خانہ کا ہر آن حامی و ناصر ہو۔آمین

[Rishta concern]
آپ کا خط ملا۔
اللہ تعالیٰ آپ کی بیٹی کے رشتہ کے مسائل کو بہتر طور پر حل کرے اور ساری پریشانیاں دور فرمائے۔ اللہ آپ کی نیک خواہشات کو بھی پورا فرمائے اور ہمیشہ آپ کا حافظ و ناصر ہو۔آمین

[Death — parent, spouse, child or sibling]
آپ کا خط ملا۔
آپ کی والدہ کی وفات کا بہت افسوس ہوا ہے۔ اناللہ وانا الیہ راجعون۔ اللہ تعالیٰ مرحومہ کو مغفرت اور رحمت کی چادر میں لپیٹ لے اور آپ کو ان کی جدائی کا صدمہ صبر سے برداشت کرنے کی توفیق دے۔ اللہ ان کے درجات بلند فرمائے اور سب لواحقین کو صبر جمیل عطا فرمائے۔ اللہ سب کا حافظ وناصر ہو۔آمین

[Death — other relative, variant A]
آپ کا خط ملا جس میں آپ نے اپنے بھائی کی وفات کی اطلاع دی ہے۔
اناللہ وانا الیہ راجعون۔ اللہ تعالیٰ مرحوم سے مغفرت کا سلوک فرمائے اور ان کے درجات بلند فرمائے۔ آپ کو اس صدمہ پر صبر اور حوصلہ عطا کرے۔ اللہ آپ کے خاندان کا خود نگہبان ہو اور سب کو اپنی حفاظت میں رکھے۔آمین

[Death — other relative, variant B]
آپ کا خط ملا۔
آپ کے خسر کی وفات کا بہت افسوس ہوا۔ اناللہ وانا الیہ راجعون۔ اللہ تعالیٰ فضل فرمائے۔ ان کو مغفرت اور رحمت کی چادر میں لپیٹ لے اور جنت میں ان کے درجات بلند فرمائے۔ اللہ سب پسماندگان کو صبر جمیل عطا کرے اور آپ سب کا ہمیشہ حافظ و ناصر ہو۔آمین

[Death — writer informs of someone else’s death]
آپ کا خط ملا جس میں آپ نے نظارت دیوان کے کارکن مکرم محمد ارشد صاحب کی وفات کی اطلاع دی ہے۔
اناللہ وانا الیہ راجعون۔ اللہ تعالیٰ مرحوم کے درجات بلند فرمائے اور مغفرت کا سلوک فرمائے۔ ان کے خاندان کو صبر اور حوصلہ دے۔ ہر قسم کی مشکل اور پریشانی سے محفوظ رکھے اور ہمیشہ آپ سب کا حافظ و ناصر ہو۔آمین

[Death — infant]
آپ کا خط ملا جس میں آپ نے اپنی نسبتی بہن کے نوزائیدہ بچے کی وفات کی اطلاع دے کر دعا کی درخواست کی ہے۔
اناللہ وانا الیہ راجعون۔ اللہ تعالیٰ انہیں اس عظیم صدمہ پر صبر دے اور اپنے فضل سے نعم البدل عطا فرمائے۔ اللہ آپ کے خاندان کا خود نگہبان ہو اور ہمیشہ آپ سب پر اپنے پیار کی نظریں ڈالتا رہے۔آمین

[Dream — good]
آپ کا خط ملا جس میں آپ نے اپنی خواب کا ذکر کیا ہے۔
ماشاءاللہ اچھی خواب ہے۔ اللہ مبارک کرے۔ اللہ تعالیٰ آپ کے ایمان اور اخلاص میں بہت برکت ڈالے۔ آپ کی نیک خواہشات کو پورا فرمائے اور ہمیشہ اپنے فضلوں سے نوازتا رہے۔ اللہ حافظ و ناصر ہو۔آمین

[Dream — worrying]
آپ کا خط ملا جس میں آپ نے اپنی ایک خواب کا ذکر کیا ہے۔
اللہ تعالیٰ فضل فرمائے۔ خواب کے منذر پہلؤوں سے آپ کو اپنی حفاظت میں رکھے۔ ہر طرح کی مشکلات سے بچائے اور خیر و بھلائی سے نوازے۔ اللہ ہمیشہ آپ کا حافظ وناصر ہو۔آمین

[Dream — unclear]
آپ کا خط ملا جس میں آپ نے اپنی خواب کا ذکر کیا ہے۔
اللہ فضل فرمائے۔ آپ کو اپنی جناب سے ہر خیر کا وارث بنائے اور امن و سکون والی بابرکت زندگی سے نوازے۔ اللہ آپ پر اپنے پیار کی نظریں ڈالتا رہے۔ ہمیشہ خلافت سے وابستہ رکھے اور اپنے فضلوں سے نوازے۔ اللہ آپ کے ساتھ ہو۔آمین

[General difficulties, no specific matter]
آپ کا خط ملا۔
اللہ تعالیٰ فضل فرمائے۔ آپ کی ساری مشکلات اور پریشانیاں دور فرمائے۔ آپ کےلئے خیر اور بھلائی کے سامان پیدا کرے اور راحت وسکون والی بابرکت زندگی عطا فرمائے۔ اللہ ہرآن آپ کے ساتھ ہو۔آمین

[Housing worry]
آپ کا خط ملا۔
اللہ تعالیٰ فضل فرمائے اور رہائش کے حوالے سے آپ کی پریشانیاں دور فرمائے۔ اللہ تعالیٰ آپ کےلئے ہمیشہ خیر اور برکت کے سامان پیدا کرتا رہے اور آپ کی نیک تمنائیں پوری فرمائے۔ اللہ حافظ و ناصر ہو۔آمین

[Worry about a child’s conduct]
آپ کا خط ملا۔
اللہ تعالیٰ فضل فرمائے۔ آپ کے بیٹے کو سمجھ عطا کرے اور اس کی طرف سے آپ کی مشکلات اور پریشانیاں دور فرمائے۔ اللہ آپ کےلئے خیر اور بھلائی کے سامان پیدا کرے اور راحت وسکون والی فعال زندگی عطا فرمائے۔ اللہ ہرآن آپ کے ساتھ ہو۔آمین

[Job / livelihood worry]
آپ کا خط ملا۔
اللہ تعالیٰ ملازمت میں حائل آپ کی تمام فکریں اور پریشانیاں دور فرمائے۔ آپ کے سب کام سنوار دے۔ دینی و دنیوی نعمتوں سے فیضیاب فرمائے اور ہر دم آپ کا اور آپ کے سب پیاروں کا حافظ و ناصر ہو۔آمین

[Community service / report]
آپ کا خط ملا جس میں آپ نے اپنی تبلیغی سرگرمیوں کا ذکر کیا ہے۔
الحمدللہ کہ آپ کو بھر پور رنگ میں تبلیغ کا موقعہ مل رہا ہے۔ اللہ تعالیٰ اس کے بہترین نتائج ظاہر فرمائے۔ آپ کی کوششوں میں برکت ڈالے اور مقبول خدمت دین کی توفیق عطا فرماتا رہے۔ اللہ حافظ و ناصر ہو۔آمین

[Responsibilities / office]
آپ کا خط ملا۔
اللہ تعالیٰ فضل فرمائے اور آپ کو اپنی مفوضہ جماعتی ذمہ داریاں احسن رنگ میں ادا کرنے کی توفیق دے۔ آپ کے کاموں میں برکت ڈالے۔ ہر مشکل کو آسان کر دے۔ اللہ ہر لمحہ آپ کا حامی وناصر ہو۔آمین

[Event]
آپ کا خط ملا جس میں آپ نے ضلع کرشنا میں ہونے والے مجلس انصاراللہ کے سالانہ اجتماع کا ذکر کرکے دعا کی درخواست کی ہے۔
اللہ تعالیٰ محض اپنے فضل سے اس اجتماع کو ہر لحاظ سے بہت بابرکت فرمائے اور تمام شاملین کو اس سے بھر پور استفادہ کرنے کی توفیق دے۔ اللہ ہمیشہ آپ سب کے ساتھ ہو اور اپنی حفظ امان میں رکھے۔آمین

[Gift]
آپ کا خط ملا۔
پرخلوص ھدیہ کا شکریہ۔ جزاکم اللہ احسن الجزاء۔ اللہ تعالیٰ آپ کے اموال و نفوس میں بہت برکت ڈالے۔ آپ پر اور آپ کے عزیز و اقارب کا پر اپنے بےشمار فضلوں اور رحمتوں کی بارش برسائے۔ نیکی اور تقویٰ میں بڑھائے اور سب نیک تمناؤں کو پورا فرمائے۔ اللہ ہرآن آپ کے ساتھ ہو۔آمین

[Eid greetings from a group]
آپ کا خط ملا۔
اپنی اور عاملہ ممبرات کی طرف سے عید کی مبارکباد بھجوانے کا شکریہ۔ جزاکم اللہ احسن الجزاء۔ آپ سب کو بھی دلی عید مبارک۔ اللہ تعالیٰ آپ سب کو مقبول خدمت کی توفیق عطا فرماتا رہے۔ اپنے دائمی فضلوں سے نوازے اور ہمیشہ خوشیاں عطا فرماتا رہے۔ اللہ حافظ و ناصر ہو۔آمین

[New convert]
آپ کا خط ملا جس میں آپ نے حال ہی میں بیعت کرنے کا ذکر کیا ہے۔
اللہ تعالیٰ آپ کو استقامت عطا کرے۔ ایمان و ایقان اور نیکی و تقویٰ میں بڑھائے اور اپنے بےشمار انعامات عطا کرے۔ اللہ آپ کو ہر قسم کی خیر و بھلائی سے نوازے اور ہمیشہ آپ کا حافظ و ناصر ہو۔آمین

[Persecution / country situation]
آپ کا خط ملا جس میں آپ نے پاکستان کے حالات دن بدن زیادہ بگڑنے پر تشویش کا اظہار کیا ہے۔
اللہ تعالیٰ فضل فرمائے۔ شریروں کے شر ان پر الٹائے۔ تمام افراد جماعت کو اپنی حفاظت میں رکھے اور آسانیاں پیدا فرمائے۔ اللہ حامی و ناصر ہو۔آمین

[Spiritual weakness]
آپ کا خط ملا جس میں آپ نے اپنی روحانی بہتری کےلئے دعا کی درخواست کی ہے۔
اللہ تعالیٰ فضل فرمائے۔ آپ کو نیکی اور تقویٰ کی راہوں پر گامزن رکھے۔ اخلاص و وفا میں بڑھائے اور ہمیشہ آپ کا حافظ و ناصر ہو۔آمین

[Office-holder asking for prayers]
آپ کا خط ملا۔
اللہ تعالیٰ فضل فرمائے۔ آپ کو اپنی مفوضہ ذمہ داریاں احسن رنگ میں ادا کرنے کی توفیق دے۔ اللہ آپ کی صلاحیتوں کو بڑھائے۔ کاموں میں آسانیاں پیدا کرے اور ہر مشکل سے بچائے۔ اللہ آپ کو مقبول خدمت کی توفیق عطا فرمائے۔آمین
</examples>`,

  outputFormat: `<output_format>
Return only valid JSON with exactly this shape:
{
  "replies": [
    {
      "letter_id": "L001",
      "full_name": "string",
      "location": "string",
      "inquiry": "string",
      "prayer_sentence": "string"
    }
  ]
}
Return exactly one object for every requested letter_id, preserve each letter_id exactly, and do not add extra letter_ids.
</output_format>`,
} as const;

export function buildDuaUrduAnalyzePdfPrompt(): string {
  return buildPsAnalyzePdfPrompt();
}

export function buildDuaUrduGenerateRepliesPrompt(
  letters: DuaUrduLetterRecord[],
): string {
  const requestedLetters = letters.map((letter) => ({
    letter_id: letter.letter_id,
    source_pages: formatPageRange(letter.source_pages),
  }));

  return [
    `<role>\n${GENERATE_SECTIONS.role}\n</role>`,
    `<task>\n${GENERATE_SECTIONS.task}\n</task>`,
    `<requested_letters>\n${JSON.stringify(requestedLetters, null, 2)}\n</requested_letters>`,
    GENERATE_SECTIONS.fieldRules,
    GENERATE_SECTIONS.styleRules,
    GENERATE_SECTIONS.compressionExamples,
    GENERATE_SECTIONS.examples,
    GENERATE_SECTIONS.outputFormat,
  ].join("\n\n");
}
