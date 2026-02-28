-- ===================================================
-- 英语学习模块数据库表
-- ===================================================

-- 1. 创建单词库表
CREATE TABLE IF NOT EXISTS english_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  definition TEXT NOT NULL,
  example TEXT,
  translation TEXT,
  level VARCHAR(20),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_english_words_level ON english_words(level);
CREATE INDEX IF NOT EXISTS idx_english_words_category ON english_words(category);

-- 2. 创建每日一句表
CREATE TABLE IF NOT EXISTS daily_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence TEXT NOT NULL,
  translation TEXT NOT NULL,
  keywords TEXT[],
  scene VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_sentences_scene ON daily_sentences(scene);

-- 3. 创建用户单词进度表
CREATE TABLE IF NOT EXISTS user_word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  word_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'learning',
  is_favorite BOOLEAN DEFAULT FALSE,
  learned_date DATE NOT NULL,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (word_id) REFERENCES english_words(id) ON DELETE CASCADE,
  UNIQUE(user_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_user_word_progress_user ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_date ON user_word_progress(learned_date);

-- 4. 创建用户学习日志表
CREATE TABLE IF NOT EXISTS user_study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  study_date DATE NOT NULL,
  words_learned INTEGER DEFAULT 0,
  study_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, study_date)
);

CREATE INDEX IF NOT EXISTS idx_user_study_logs_user ON user_study_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_study_logs_date ON user_study_logs(study_date);

-- ===================================================
-- 插入初始单词数据（100个高频单词）
-- ===================================================

INSERT INTO english_words (word, phonetic, definition, example, translation, level, category) VALUES
-- A1级别单词（基础日常）
('hello', '/həˈloʊ/', '你好；问候', 'Hello, nice to meet you!', '你好，很高兴见到你！', 'A1', '日常用语'),
('thanks', '/θæŋks/', '谢谢', 'Thanks for your help.', '谢谢你的帮助。', 'A1', '日常用语'),
('goodbye', '/ɡʊdˈbaɪ/', '再见', 'Goodbye, see you tomorrow!', '再见，明天见！', 'A1', '日常用语'),
('please', '/pliːz/', '请；使高兴', 'Please wait a moment.', '请稍等一下。', 'A1', '日常用语'),
('sorry', '/ˈsɑːri/', '对不起；抱歉的', 'Sorry, I''m late.', '对不起，我迟到了。', 'A1', '日常用语'),
('yes', '/jes/', '是的', 'Yes, I agree with you.', '是的，我同意你。', 'A1', '日常用语'),
('no', '/noʊ/', '不；没有', 'No, I don''t think so.', '不，我不这么认为。', 'A1', '日常用语'),
('help', '/help/', '帮助', 'Can you help me?', '你能帮我吗？', 'A1', '日常用语'),
('time', '/taɪm/', '时间', 'What time is it?', '现在几点了？', 'A1', '日常用语'),
('day', '/deɪ/', '天；白天', 'Have a nice day!', '祝你有美好的一天！', 'A1', '日常用语'),

-- A2级别单词（工作学习）
('work', '/wɜːrk/', '工作；运作', 'I work in an office.', '我在办公室工作。', 'A2', '职场'),
('meeting', '/ˈmiːtɪŋ/', '会议；见面', 'We have a meeting at 3 PM.', '我们下午3点有个会议。', 'A2', '职场'),
('project', '/ˈprɑːdʒekt/', '项目；工程', 'This is an important project.', '这是一个重要的项目。', 'A2', '职场'),
('team', '/tiːm/', '团队；组', 'Our team works well together.', '我们的团队合作很好。', 'A2', '职场'),
('schedule', '/ˈskedʒuːl/', '日程；时间表', 'Let me check my schedule.', '让我看看我的日程。', 'A2', '职场'),
('deadline', '/ˈdedlaɪn/', '截止日期', 'The deadline is next Friday.', '截止日期是下周五。', 'A2', '职场'),
('report', '/rɪˈpɔːrt/', '报告；汇报', 'I need to finish this report.', '我需要完成这份报告。', 'A2', '职场'),
('colleague', '/ˈkɑːliːɡ/', '同事', 'My colleague helped me a lot.', '我的同事帮了我很多。', 'A2', '职场'),
('office', '/ˈɔːfɪs/', '办公室', 'I''ll be in the office tomorrow.', '我明天会在办公室。', 'A2', '职场'),
('email', '/ˈiːmeɪl/', '电子邮件', 'I sent you an email yesterday.', '我昨天给你发了邮件。', 'A2', '职场'),

-- B1级别单词（沟通表达）
('discuss', '/dɪˈskʌs/', '讨论；商讨', 'Let''s discuss this issue.', '让我们讨论一下这个问题。', 'B1', '沟通'),
('suggest', '/səˈdʒest/', '建议；提议', 'I suggest we start earlier.', '我建议我们早点开始。', 'B1', '沟通'),
('opinion', '/əˈpɪnjən/', '意见；看法', 'What''s your opinion on this?', '你对此有什么看法？', 'B1', '沟通'),
('agree', '/əˈɡriː/', '同意；赞成', 'I agree with your point.', '我同意你的观点。', 'B1', '沟通'),
('explain', '/ɪkˈspleɪn/', '解释；说明', 'Can you explain this to me?', '你能给我解释一下吗？', 'B1', '沟通'),
('understand', '/ˌʌndərˈstænd/', '理解；明白', 'I understand your concern.', '我理解你的担忧。', 'B1', '沟通'),
('communicate', '/kəˈmjuːnɪkeɪt/', '交流；沟通', 'We need to communicate better.', '我们需要更好地沟通。', 'B1', '沟通'),
('improve', '/ɪmˈpruːv/', '改进；提高', 'How can we improve this?', '我们如何改进这个？', 'B1', '沟通'),
('solution', '/səˈluːʃn/', '解决方案', 'We need to find a solution.', '我们需要找到解决方案。', 'B1', '沟通'),
('problem', '/ˈprɑːbləm/', '问题；难题', 'We have a problem here.', '我们这里有个问题。', 'B1', '沟通'),

-- B2级别单词（商务专业）
('analyze', '/ˈænəlaɪz/', '分析', 'Let''s analyze the data.', '让我们分析一下数据。', 'B2', '商务'),
('strategy', '/ˈstrætədʒi/', '策略；战略', 'We need a new strategy.', '我们需要一个新策略。', 'B2', '商务'),
('implement', '/ˈɪmplɪment/', '实施；执行', 'We will implement this plan.', '我们将实施这个计划。', 'B2', '商务'),
('efficient', '/ɪˈfɪʃnt/', '高效的；有效率的', 'This is a very efficient method.', '这是一个非常高效的方法。', 'B2', '商务'),
('negotiate', '/nɪˈɡoʊʃieɪt/', '谈判；协商', 'We need to negotiate the terms.', '我们需要协商条款。', 'B2', '商务'),
('contract', '/ˈkɑːntrækt/', '合同；契约', 'Please review the contract.', '请审查这份合同。', 'B2', '商务'),
('budget', '/ˈbʌdʒɪt/', '预算', 'What''s our budget for this?', '我们这个项目的预算是多少？', 'B2', '商务'),
('profit', '/ˈprɑːfɪt/', '利润；收益', 'The profit increased this year.', '今年的利润增加了。', 'B2', '商务'),
('revenue', '/ˈrevənuː/', '收入；收益', 'Our revenue is growing.', '我们的收入在增长。', 'B2', '商务'),
('investment', '/ɪnˈvestmənt/', '投资', 'This is a good investment.', '这是一个好的投资。', 'B2', '商务'),

-- 旅行相关单词
('travel', '/ˈtrævl/', '旅行；出行', 'I love to travel abroad.', '我喜欢出国旅行。', 'A2', '旅行'),
('hotel', '/hoʊˈtel/', '旅馆；酒店', 'I booked a hotel room.', '我订了一间酒店房间。', 'A2', '旅行'),
('flight', '/flaɪt/', '航班；飞行', 'My flight is at 8 AM.', '我的航班是早上8点。', 'A2', '旅行'),
('airport', '/ˈerpɔːrt/', '机场', 'I''ll pick you up at the airport.', '我会去机场接你。', 'A2', '旅行'),
('ticket', '/ˈtɪkɪt/', '票；门票', 'I have two tickets for the show.', '我有两张演出的票。', 'A2', '旅行'),
('passport', '/ˈpæspɔːrt/', '护照', 'Don''t forget your passport.', '别忘了你的护照。', 'A2', '旅行'),
('luggage', '/ˈlʌɡɪdʒ/', '行李', 'Where is my luggage?', '我的行李在哪里？', 'A2', '旅行'),
('reservation', '/ˌrezərˈveɪʃn/', '预订', 'I have a reservation under Smith.', '我有一个Smith名下的预订。', 'B1', '旅行'),
('destination', '/ˌdestɪˈneɪʃn/', '目的地', 'What''s your destination?', '你的目的地是哪里？', 'B1', '旅行'),
('tourist', '/ˈtʊrɪst/', '游客', 'Many tourists visit here.', '很多游客来这里参观。', 'B1', '旅行'),

-- 餐饮相关单词
('restaurant', '/ˈrestrɑːnt/', '餐厅', 'Let''s go to a restaurant.', '我们去餐厅吧。', 'A2', '餐饮'),
('menu', '/ˈmenjuː/', '菜单', 'Can I see the menu, please?', '我可以看看菜单吗？', 'A2', '餐饮'),
('order', '/ˈɔːrdər/', '点餐；命令', 'Are you ready to order?', '您准备好点餐了吗？', 'A2', '餐饮'),
('delicious', '/dɪˈlɪʃəs/', '美味的', 'This food is delicious!', '这食物很美味！', 'A2', '餐饮'),
('breakfast', '/ˈbrekfəst/', '早餐', 'What do you want for breakfast?', '你早餐想吃什么？', 'A1', '餐饮'),
('lunch', '/lʌntʃ/', '午餐', 'Let''s have lunch together.', '我们一起吃午餐吧。', 'A1', '餐饮'),
('dinner', '/ˈdɪnər/', '晚餐', 'What time is dinner?', '晚餐几点？', 'A1', '餐饮'),
('coffee', '/ˈkɔːfi/', '咖啡', 'I need a cup of coffee.', '我需要一杯咖啡。', 'A1', '餐饮'),
('water', '/ˈwɔːtər/', '水', 'Can I have some water?', '我可以要些水吗？', 'A1', '餐饮'),
('bill', '/bɪl/', '账单', 'Can I have the bill, please?', '请给我账单。', 'A2', '餐饮'),

-- 购物相关单词
('shop', '/ʃɑːp/', '商店；购物', 'I need to go shopping.', '我需要去购物。', 'A1', '购物'),
('buy', '/baɪ/', '买；购买', 'I want to buy this.', '我想买这个。', 'A1', '购物'),
('price', '/praɪs/', '价格', 'What''s the price?', '价格是多少？', 'A1', '购物'),
('expensive', '/ɪkˈspensɪv/', '昂贵的', 'This is too expensive.', '这太贵了。', 'A2', '购物'),
('cheap', '/tʃiːp/', '便宜的', 'I found a cheap option.', '我找到了一个便宜的选择。', 'A2', '购物'),
('discount', '/ˈdɪskaʊnt/', '折扣', 'Is there any discount?', '有折扣吗？', 'A2', '购物'),
('sale', '/seɪl/', '销售；特价', 'There''s a big sale today.', '今天有大减价。', 'A2', '购物'),
('store', '/stɔːr/', '商店；储存', 'The store opens at 9 AM.', '商店早上9点开门。', 'A2', '购物'),
('pay', '/peɪ/', '支付；付款', 'How would you like to pay?', '您想怎么付款？', 'A1', '购物'),
('receipt', '/rɪˈsiːt/', '收据', 'Can I have a receipt?', '我可以要收据吗？', 'A2', '购物'),

-- 健康相关单词
('health', '/helθ/', '健康', 'Health is very important.', '健康非常重要。', 'A2', '健康'),
('doctor', '/ˈdɑːktər/', '医生', 'I need to see a doctor.', '我需要看医生。', 'A1', '健康'),
('hospital', '/ˈhɑːspɪtl/', '医院', 'He is in the hospital.', '他在医院。', 'A1', '健康'),
('medicine', '/ˈmedɪsn/', '药物；医学', 'Take this medicine twice a day.', '这个药一天吃两次。', 'A2', '健康'),
('exercise', '/ˈeksərsaɪz/', '锻炼；练习', 'I exercise every morning.', '我每天早上锻炼。', 'A2', '健康'),
('tired', '/ˈtaɪərd/', '疲倦的', 'I feel very tired today.', '我今天感觉很累。', 'A1', '健康'),
('sleep', '/sliːp/', '睡觉；睡眠', 'I need more sleep.', '我需要更多睡眠。', 'A1', '健康'),
('headache', '/ˈhedeɪk/', '头痛', 'I have a headache.', '我头疼。', 'A2', '健康'),
('fever', '/ˈfiːvər/', '发烧', 'He has a high fever.', '他发高烧了。', 'A2', '健康'),
('healthy', '/ˈhelθi/', '健康的', 'Eat healthy food.', '吃健康的食物。', 'A2', '健康'),

-- 技术相关单词
('computer', '/kəmˈpjuːtər/', '电脑', 'My computer is not working.', '我的电脑坏了。', 'A1', '技术'),
('internet', '/ˈɪntərnet/', '互联网', 'I need internet access.', '我需要网络连接。', 'A2', '技术'),
('website', '/ˈwebsaɪt/', '网站', 'Visit our website for more info.', '访问我们的网站了解更多信息。', 'A2', '技术'),
('app', '/æp/', '应用程序', 'Download this app.', '下载这个应用。', 'A2', '技术'),
('password', '/ˈpæswɜːrd/', '密码', 'Enter your password.', '输入你的密码。', 'A2', '技术'),
('download', '/ˈdaʊnloʊd/', '下载', 'You can download it here.', '你可以在这里下载。', 'A2', '技术'),
('upload', '/ˈʌploʊd/', '上传', 'Upload your files here.', '在这里上传你的文件。', 'B1', '技术'),
('software', '/ˈsɔːftwer/', '软件', 'This software is very useful.', '这个软件非常有用。', 'B1', '技术'),
('update', '/ˈʌpdeɪt/', '更新', 'Please update the software.', '请更新软件。', 'A2', '技术'),
('device', '/dɪˈvaɪs/', '设备；装置', 'This device is portable.', '这个设备是便携式的。', 'B1', '技术');

-- ===================================================
-- 插入每日一句数据（30句）
-- ===================================================

INSERT INTO daily_sentences (sentence, translation, keywords, scene) VALUES
('Have a great day!', '祝你有美好的一天！', ARRAY['have', 'great', 'day'], '日常问候'),
('How are you doing?', '你最近怎么样？', ARRAY['how', 'doing'], '日常问候'),
('Nice to meet you!', '很高兴见到你！', ARRAY['nice', 'meet'], '日常问候'),
('See you later!', '待会见！', ARRAY['see', 'later'], '日常问候'),
('Take care!', '保重！', ARRAY['take', 'care'], '日常问候'),

('I''m looking forward to it.', '我很期待。', ARRAY['looking forward'], '表达期待'),
('That sounds great!', '听起来不错！', ARRAY['sounds', 'great'], '表达赞同'),
('I completely agree.', '我完全同意。', ARRAY['completely', 'agree'], '表达赞同'),
('Let me think about it.', '让我想想。', ARRAY['think', 'about'], '思考回应'),
('That makes sense.', '这很合理。', ARRAY['makes', 'sense'], '表达理解'),

('Could you please help me?', '你能帮我吗？', ARRAY['could', 'please', 'help'], '请求帮助'),
('Would you mind if I...?', '你介意我...吗？', ARRAY['would', 'mind'], '礼貌询问'),
('May I ask you a question?', '我可以问你一个问题吗？', ARRAY['may', 'ask', 'question'], '礼貌询问'),
('Excuse me, where is...?', '打扰一下，...在哪里？', ARRAY['excuse', 'where'], '问路'),
('I''d like to make a reservation.', '我想预订。', ARRAY['make', 'reservation'], '预订'),

('Let''s get down to business.', '让我们开始谈正事吧。', ARRAY['get down', 'business'], '商务会议'),
('I''ll keep you updated.', '我会让你知道最新情况。', ARRAY['keep', 'updated'], '商务沟通'),
('We need to meet the deadline.', '我们需要赶上截止日期。', ARRAY['meet', 'deadline'], '工作压力'),
('Can we schedule a meeting?', '我们能安排一个会议吗？', ARRAY['schedule', 'meeting'], '安排会议'),
('I''ll get back to you soon.', '我很快回复你。', ARRAY['get back', 'soon'], '工作回应'),

('Time flies!', '时间过得真快！', ARRAY['time', 'flies'], '感叹时间'),
('Better late than never.', '迟做总比不做好。', ARRAY['better', 'late', 'never'], '鼓励'),
('Practice makes perfect.', '熟能生巧。', ARRAY['practice', 'perfect'], '学习建议'),
('Actions speak louder than words.', '行动胜于言语。', ARRAY['actions', 'words'], '人生哲理'),
('Every cloud has a silver lining.', '黑暗中总有一线光明。', ARRAY['cloud', 'silver lining'], '积极思维'),

('What do you recommend?', '你推荐什么？', ARRAY['recommend'], '餐厅点餐'),
('I''ll have the same.', '我也要一样的。', ARRAY['have', 'same'], '餐厅点餐'),
('The bill, please.', '请买单。', ARRAY['bill', 'please'], '结账'),
('Keep the change.', '不用找零了。', ARRAY['keep', 'change'], '支付小费'),
('It was delicious!', '太好吃了！', ARRAY['delicious'], '餐后评价'),
('Bon appétit!', '祝你用餐愉快！', ARRAY['bon', 'appétit'], '用餐祝福');

-- ===================================================
-- 完成提示
-- ===================================================

-- 查看插入的数据
SELECT '成功创建英语学习模块数据库表！' as message;
SELECT '单词总数:', COUNT(*) FROM english_words;
SELECT '每日一句总数:', COUNT(*) FROM daily_sentences;
