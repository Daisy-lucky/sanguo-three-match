/**
 * 三国消消乐 - 游戏核心逻辑
 * 类似羊了个羊的堆叠消除游戏
 */

// 卡牌数据
const CARD_TYPES = [
    // 魏国
    { id: 'caocao', emoji: '👑', faction: 'wei', name: '曹操' },
    { id: 'simayi', emoji: '🦉', faction: 'wei', name: '司马懿' },
    { id: 'xiahou', emoji: '👁️', faction: 'wei', name: '夏侯惇' },
    { id: 'zhangliao', emoji: '⚔️', faction: 'wei', name: '张辽' },
    // 蜀国
    { id: 'liubei', emoji: '🎭', faction: 'shu', name: '刘备' },
    { id: 'guanyu', emoji: '🐉', faction: 'shu', name: '关羽' },
    { id: 'zhangfei', emoji: '😠', faction: 'shu', name: '张飞' },
    { id: 'zhugeliang', emoji: '🪶', faction: 'shu', name: '诸葛亮' },
    // 吴国
    { id: 'sunquan', emoji: '👑', faction: 'wu', name: '孙权' },
    { id: 'zhouyu', emoji: '🔥', faction: 'wu', name: '周瑜' },
    { id: 'luxun', emoji: '📚', faction: 'wu', name: '陆逊' },
    { id: 'sunshangxiang', emoji: '👸', faction: 'wu', name: '孙尚香' },
    // 群雄
    { id: 'lvbu', emoji: '👿', faction: 'qun', name: '吕布' },
    { id: 'dongzhuo', emoji: '👹', faction: 'qun', name: '董卓' },
    { id: 'diaochan', emoji: '🌙', faction: 'qun', name: '貂蝉' },
    { id: 'huaxiong', emoji: '👺', faction: 'qun', name: '华雄' },
    // 物品
    { id: 'sword', emoji: '🗡️', faction: 'item', name: '武器' },
    { id: 'horse', emoji: '🐎', faction: 'item', name: '坐骑' },
    { id: 'gem', emoji: '💎', faction: 'item', name: '宝物' },
];

// 关卡配置
const LEVELS = [
    { level: 1, cards: 36, layers: 2, name: '黄巾之乱' },
    { level: 2, cards: 72, layers: 3, name: '群雄逐鹿' },
    { level: 3, cards: 108, layers: 3, name: '三国鼎立' },
    { level: 4, cards: 144, layers: 4, name: '一统天下' },
];

class Game {
    constructor() {
        this.level = 1;
        this.cards = [];
        this.slots = [];
        this.maxSlots = 7;
        this.tools = { undo: 3, shuffle: 3, hint: 3, addSlot: 1 };
        this.lastRemovedCard = null;
        this.combo = 0;
        this.init();
    }
    
    init() {
        this.board = document.getElementById('card-board');
        this.slotsContainer = document.getElementById('card-slots');
        this.comboDisplay = document.getElementById('combo-display');
    }
    
    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        this.loadLevel(this.level);
    }
    
    loadLevel(level) {
        const config = LEVELS.find(l => l.level === level) || LEVELS[0];
        document.getElementById('level-num').textContent = level;
        
        // 生成卡牌（必须是 3 的倍数）
        const cardCount = Math.floor(config.cards / 3) * 3;
        this.generateCards(cardCount, config.layers);
        
        this.slots = [];
        this.lastRemovedCard = null;
        this.combo = 0;
        this.renderSlots();
        this.updateProgress();
    }
    
    generateCards(count, layers) {
        this.cards = [];
        const typesCount = Math.ceil(count / 9);
        const selectedTypes = CARD_TYPES.slice(0, typesCount);
        
        // 每种卡牌 3 张
        const deck = [];
        for (let i = 0; i < count / 3; i++) {
            const type = selectedTypes[i % selectedTypes.length];
            for (let j = 0; j < 3; j++) {
                deck.push({ ...type, uid: Date.now() + Math.random() });
            }
        }
        
        // 打乱顺序
        this.shuffleArray(deck);
        
        // 生成堆叠布局
        const boardWidth = this.board.clientWidth || 350;
        const boardHeight = this.board.clientHeight || 400;
        const cardWidth = 50;
        const cardHeight = 60;
        const cols = Math.floor(boardWidth / cardWidth) - 1;
        const rows = Math.floor(boardHeight / cardHeight) - 1;
        
        deck.forEach((card, index) => {
            // 分层放置
            const layer = Math.floor(index / (count / layers)) % layers;
            const col = index % cols;
            const row = Math.floor(index / cols) % rows;
            
            card.x = 20 + col * cardWidth + (layer * 5);
            card.y = 20 + row * cardHeight + (layer * 5);
            card.layer = layer;
            card.zIndex = layer;
            card.covered = false;
            
            this.cards.push(card);
        });
        
        this.updateCardCoverage();
        this.renderBoard();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    updateCardCoverage() {
        // 检查每张卡牌是否被上层卡牌覆盖
        this.cards.forEach(card => {
            card.covered = false;
            this.cards.forEach(other => {
                if (other === card) return;
                if (other.layer > card.layer) {
                    // 检查是否重叠
                    const dx = Math.abs(other.x - card.x);
                    const dy = Math.abs(other.y - card.y);
                    if (dx < 40 && dy < 50) {
                        card.covered = true;
                    }
                }
            });
        });
    }
    
    renderBoard() {
        this.board.innerHTML = '';
        
        // 按层级排序渲染
        const sortedCards = [...this.cards].sort((a, b) => a.zIndex - b.zIndex);
        
        sortedCards.forEach(card => {
            if (card.removed) return;
            
            const el = document.createElement('div');
            el.className = `card faction-${card.faction}${card.covered ? ' disabled' : ''}`;
            el.style.left = card.x + 'px';
            el.style.top = card.y + 'px';
            el.style.zIndex = card.zIndex;
            el.innerHTML = `
                <div class="card-emoji">${card.emoji}</div>
                <div class="card-faction">${card.name}</div>
            `;
            
            if (!card.covered) {
                el.onclick = () => this.clickCard(card);
            }
            
            this.board.appendChild(el);
            card.el = el;
        });
    }
    
    clickCard(card) {
        if (card.covered || card.removed) return;
        if (this.slots.length >= this.maxSlots) {
            this.gameOver(false);
            return;
        }
        
        // 从棋盘移除
        card.removed = true;
        if (card.el) card.el.remove();
        
        // 添加到卡槽
        this.slots.push(card);
        this.renderSlots();
        this.updateCardCoverage();
        this.renderBoard();
        this.updateProgress();
        
        // 检查消除
        this.checkMatch();
        
        // 检查胜利
        if (this.cards.every(c => c.removed)) {
            this.gameOver(true);
        }
    }
    
    checkMatch() {
        // 统计每种卡牌数量
        const countMap = {};
        this.slots.forEach(card => {
            const key = card.id;
            countMap[key] = countMap[key] || [];
            countMap[key].push(card);
        });
        
        // 检查是否有 3 张相同的
        for (let key in countMap) {
            if (countMap[key].length >= 3) {
                // 消除
                const toRemove = countMap[key].slice(0, 3);
                toRemove.forEach(card => {
                    this.slots = this.slots.filter(c => c !== card);
                });
                
                this.combo++;
                if (this.combo > 1) {
                    this.showCombo(this.combo);
                }
                
                this.renderSlots();
                this.updateProgress();
                
                // 递归检查
                setTimeout(() => this.checkMatch(), 100);
                return;
            }
        }
        
        this.combo = 0;
    }
    
    renderSlots() {
        this.slotsContainer.innerHTML = '';
        
        // 渲染空槽
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            
            if (this.slots[i]) {
                const card = this.slots[i];
                const cardEl = document.createElement('div');
                cardEl.className = `card faction-${card.faction}`;
                cardEl.innerHTML = `<div class="card-emoji">${card.emoji}</div>`;
                slot.appendChild(cardEl);
            }
            
            this.slotsContainer.appendChild(slot);
        }
    }
    
    updateProgress() {
        const remaining = this.cards.filter(c => !c.removed).length;
        document.getElementById('cards-left').textContent = remaining;
    }
    
    showCombo(count) {
        this.comboDisplay.textContent = `${count} 连击！`;
        this.comboDisplay.classList.remove('show');
        void this.comboDisplay.offsetWidth; // 触发重绘
        this.comboDisplay.classList.add('show');
    }
    
    useTool(toolType) {
        if (this.tools[toolType] <= 0) return;
        
        switch(toolType) {
            case 'undo':
                this.undo();
                break;
            case 'shuffle':
                this.shuffleBoard();
                break;
            case 'hint':
                this.showHint();
                break;
            case 'addSlot':
                this.addSlot();
                break;
        }
        
        this.tools[toolType]--;
        document.getElementById(`tool-${toolType}`).textContent = this.tools[toolType];
    }
    
    undo() {
        if (this.slots.length === 0 || !this.lastRemovedCard) return;
        
        const card = this.slots.pop();
        card.removed = false;
        this.cards.push(card);
        this.updateCardCoverage();
        this.renderBoard();
        this.renderSlots();
    }
    
    shuffleBoard() {
        const remaining = this.cards.filter(c => !c.removed);
        const boardWidth = this.board.clientWidth || 350;
        const boardHeight = this.board.clientHeight || 400;
        const cardWidth = 50;
        const cardHeight = 60;
        const cols = Math.floor(boardWidth / cardWidth) - 1;
        const rows = Math.floor(boardHeight / cardHeight) - 1;
        
        remaining.forEach((card, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols) % rows;
            card.x = 20 + col * cardWidth;
            card.y = 20 + row * cardHeight;
        });
        
        this.updateCardCoverage();
        this.renderBoard();
    }
    
    showHint() {
        // 找到可以消除的卡牌
        const countMap = {};
        this.slots.forEach(card => {
            countMap[card.id] = countMap[card.id] || 0;
            countMap[card.id]++;
        });
        
        // 高亮显示
        const remaining = this.cards.filter(c => !c.removed && !c.covered);
        remaining.forEach(card => {
            if (card.el) {
                card.el.style.boxShadow = '0 0 15px #ffd700';
                setTimeout(() => {
                    card.el.style.boxShadow = '';
                }, 1000);
            }
        });
    }
    
    addSlot() {
        this.maxSlots++;
        this.renderSlots();
    }
    
    gameOver(win) {
        const el = document.getElementById('game-over');
        const title = document.getElementById('game-over-title');
        const nextBtn = document.getElementById('next-level-btn');
        
        el.classList.add('show');
        
        if (win) {
            title.textContent = '🎉 胜利！';
            title.className = 'game-over-title win';
            nextBtn.style.display = 'block';
        } else {
            title.textContent = '💀 游戏结束';
            title.className = 'game-over-title lose';
            nextBtn.style.display = 'none';
        }
    }
    
    restartGame() {
        document.getElementById('game-over').classList.remove('show');
        this.loadLevel(this.level);
    }
    
    nextLevel() {
        document.getElementById('game-over').classList.remove('show');
        this.level++;
        if (this.level > LEVELS.length) this.level = 1;
        this.loadLevel(this.level);
    }
}

// 微信小游戏适配
if (typeof wx !== 'undefined') {
    // 微信环境
    wx.onShareAppMessage(() => {
        return {
            title: '三国消消乐 - 你能通过第几关？',
            path: '/pages/index/index'
        };
    });
}

// 启动游戏
const game = new Game();
