import java.awt.Color  
import java.awt.Dimension  
import java.awt.Graphics  
import java.awt.event.KeyAdapter  
import java.awt.event.KeyEvent  
import java.io.File  
import java.util.Stack  
import javax.swing.JFrame  
import javax.swing.JOptionPane  
import javax.swing.JPanel  
import javax.swing.SwingUtilities  
  
// 地图元素常量  
const val FLOOR = 0  
const val WALL = 1  
const val TARGET = 2  
const val BOX = 4  
const val BOX_ON_TARGET = 6  
const val TILE_SIZE = 50  
  
// 存储从TXT解析出来的单个关卡数据  
data class LevelData(  
    val mapState: Array<IntArray>,  
    val startX: Int,  
    val startY: Int  
) {  
    // 🛠️【彻底修复手误】：宽度必须获取首行的长度，即 mapState[0].size    val width: Int get() = if (mapState.isNotEmpty()) mapState[0].size else 0  
    val height: Int get() = mapState.size  
}  
  
// 历史记录快照类，用于 Z 键撤销  
data class GameSnapshot(  
    val mapState: Array<IntArray>,  
    val playerX: Int,  
    val playerY: Int  
) {  
    fun cloneMap(): Array<IntArray> = mapState.map { it.clone() }.toTypedArray()  
}  
  
class TxtSokoban(private val levels: List<LevelData>) : JPanel() {  
    private var currentLevelIndex = 0  
    private lateinit var map: Array<IntArray>  
    private var playerX = 0  
    private var playerY = 0  
    private val undoStack = Stack<GameSnapshot>()  
  
    init {  
        loadLevel(currentLevelIndex)  
        background = Color(240, 240, 240)  
        isFocusable = true  
  
        addKeyListener(object : KeyAdapter() {  
            override fun keyPressed(e: KeyEvent) {  
                when (e.keyCode) {  
                    KeyEvent.VK_UP -> movePlayer(0, -1)  
                    KeyEvent.VK_DOWN -> movePlayer(0, 1)  
                    KeyEvent.VK_LEFT -> movePlayer(-1, 0)  
                    KeyEvent.VK_RIGHT -> movePlayer(1, 0)  
                    KeyEvent.VK_Z -> undoLastMove()  
                }  
            }  
        })  
    }  
  
    private fun loadLevel(index: Int) {  
        if (index < levels.size) {  
            currentLevelIndex = index  
            val currentLevel = levels[index]  
  
            // 克隆地图  
            map = currentLevel.mapState.map { it.clone() }.toTypedArray()  
            playerX = currentLevel.startX  
            playerY = currentLevel.startY  
  
            // 🛡️【智能安全降落兜底】：如果读取到的玩家坐标在墙壁里、或者由于手误出了边界  
            if (playerY !in map.indices || playerX !in map[playerY].indices || map[playerY][playerX] == WALL) {  
                var foundSafeSpot = false  
                // 自动扫描寻找第一个可以供玩家站立的空白地板  
                for (y in map.indices) {  
                    for (x in map[y].indices) {  
                        if (map[y][x] == FLOOR) {  
                            playerX = x  
                            playerY = y  
                            foundSafeSpot = true  
                            break                        }  
                    }  
                    if (foundSafeSpot) break  
                }  
            }  
  
            undoStack.clear()  
  
            // 🛠️ 精准计算实际高宽像素，游戏窗口再也不会被挤压  
            val mapHeight = currentLevel.height * TILE_SIZE  
            val mapWidth = currentLevel.width * TILE_SIZE  
            preferredSize = Dimension(mapWidth, mapHeight)  
  
            revalidate()  
            repaint()  
        } else {  
            JOptionPane.showMessageDialog(this, "太厉害了！你已经通关了所有的关卡！")  
            System.exit(0)  
        }  
    }  
  
    private fun saveState() {  
        val snapshot = GameSnapshot(map.map { it.clone() }.toTypedArray(), playerX, playerY)  
        undoStack.push(snapshot)  
    }  
  
    private fun undoLastMove() {  
        if (undoStack.isNotEmpty()) {  
            val previousState = undoStack.pop()  
            map = previousState.cloneMap()  
            playerX = previousState.playerX  
            playerY = previousState.playerY  
            repaint()  
        }  
    }  
  
    private fun movePlayer(dx: Int, dy: Int) {  
        val nextX = playerX + dx  
        val nextY = playerY + dy  
  
        // 边界及墙壁阻挡检查  
        if (nextY !in map.indices || nextX !in map[nextY].indices || map[nextY][nextX] == WALL) return  
  
        val currentTarget = map[nextY][nextX]  
        var moved = false  
  
        if (currentTarget == FLOOR || currentTarget == TARGET) {  
            saveState()  
            playerX = nextX  
            playerY = nextY  
            moved = true  
        } else if (currentTarget == BOX || currentTarget == BOX_ON_TARGET) {  
            val boxNextX = nextX + dx  
            val boxNextY = nextY + dy  
  
            if (boxNextY in map.indices && boxNextX in map[boxNextY].indices && map[boxNextY][boxNextX] != WALL) {  
                val boxTarget = map[boxNextY][boxNextX]  
  
                if (boxTarget == FLOOR || boxTarget == TARGET) {  
                    saveState()  
                    map[boxNextY][boxNextX] = if (boxTarget == TARGET) BOX_ON_TARGET else BOX  
                    map[nextY][nextX] = if (currentTarget == BOX_ON_TARGET) TARGET else FLOOR  
                    playerX = nextX  
                    playerY = nextY  
                    moved = true  
                }  
            }  
        }  
  
        if (moved) {  
            repaint()  
            if (checkWin()) {  
                JOptionPane.showMessageDialog(this, "关卡 ${currentLevelIndex + 1} 完成！即将进入下一关。")  
                loadLevel(currentLevelIndex + 1)  
            }  
        }  
    }  
  
    override fun paintComponent(g: Graphics) {  
        super.paintComponent(g)  
        for (y in map.indices) {  
            for (x in map[y].indices) {  
                val tileX = x * TILE_SIZE  
                val tileY = y * TILE_SIZE  
  
                // 强制刷一层地基色  
                g.color = Color(255, 255, 255)  
                g.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE)  
  
                when (map[y][x]) {  
                    WALL -> {  
                        g.color = Color(44, 62, 80) // 墙壁  
                        g.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE)  
                    }  
                    TARGET -> {  
                        g.color = Color(231, 76, 60) // 红色圆形目标点  
                        g.fillOval(tileX + 15, tileY + 15, 20, 20)  
                    }  
                    BOX -> {  
                        g.color = Color(230, 126, 34) // 橙色箱子  
                        g.fillRect(tileX + 4, tileY + 4, TILE_SIZE - 8, TILE_SIZE - 8)  
                    }  
                    BOX_ON_TARGET -> {  
                        g.color = Color(46, 204, 113) // 箱子到位变绿色  
                        g.fillRect(tileX + 4, tileY + 4, TILE_SIZE - 8, TILE_SIZE - 8)  
                    }  
                }  
                // 绘制轻微的网格分割线  
                g.color = Color(220, 220, 220)  
                g.drawRect(tileX, tileY, TILE_SIZE, TILE_SIZE)  
            }  
        }  
        // 精确绘制可移动玩家（紫色圆角矩形）  
        g.color = Color(155, 89, 182)  
        g.fillRoundRect(playerX * TILE_SIZE + 6, playerY * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12, 15, 15)  
    }  
  
    private fun checkWin(): Boolean {  
        for (y in map.indices) {  
            for (x in map[y].indices) {  
                if (map[y][x] == BOX) return false  
            }  
        }  
        return true  
    }  
}  
  
// 解析外部文本  
fun loadLevelsFromTxt(filePath: String): List<LevelData> {  
    val file = File(filePath)  
    if (!file.exists()) {  
        JOptionPane.showMessageDialog(null, "找不到关卡文件！\n路径为：${file.absolutePath}")  
        System.exit(1)  
    }  
  
    val parsedLevels = mutableListOf<LevelData>()  
    var currentLevelRows = mutableListOf<String>()  
  
    file.forEachLine { line ->  
        val trimmed = line.trim()  
        if (trimmed.startsWith("//") || trimmed.isEmpty()) {  
            if (currentLevelRows.isNotEmpty()) {  
                parsedLevels.add(parseSingleLevel(currentLevelRows))  
                currentLevelRows = mutableListOf()  
            }  
        } else {  
            currentLevelRows.add(trimmed)  
        }  
    }  
    if (currentLevelRows.isNotEmpty()) {  
        parsedLevels.add(parseSingleLevel(currentLevelRows))  
    }  
  
    if (parsedLevels.isEmpty()) {  
        JOptionPane.showMessageDialog(null, "levels.txt 中未发现有效的地图数据！")  
        System.exit(1)  
    }  
  
    return parsedLevels  
}  
  
fun parseSingleLevel(rows: List<String>): LevelData {  
    val height = rows.size  
    val width = rows.maxOf { it.length }  
    val grid = Array(height) { IntArray(width) { FLOOR } }  
    var pX = -1  
    var pY = -1  
  
    for (y in rows.indices) {  
        val rowText = rows[y]  
        for (x in rowText.indices) {  
            if (x < rowText.length) {  
                when (rowText[x]) {  
                    '#' -> grid[y][x] = WALL  
                    '-' -> grid[y][x] = FLOOR  
                    '.' -> grid[y][x] = TARGET  
                    '$' -> grid[y][x] = BOX  
                    '*' -> grid[y][x] = BOX_ON_TARGET  
                    'P' -> {  
                        grid[y][x] = FLOOR  
                        pX = x  
                        pY = y  
                    }  
                }  
            }  
        }  
    }  
    return LevelData(grid, pX, pY)  
}  
  
fun main() {  
    SwingUtilities.invokeLater {  
        val loadedLevels = loadLevelsFromTxt("levels.txt")  
        val frame = JFrame("Kotlin 经典推箱子 - 完美解耦修复版")  
        frame.defaultCloseOperation = JFrame.EXIT_ON_CLOSE  
  
        val gamePanel = TxtSokoban(loadedLevels)  
        frame.add(gamePanel)  
        frame.pack()  
        frame.setLocationRelativeTo(null)  
        frame.isVisible = true  
    }  
}