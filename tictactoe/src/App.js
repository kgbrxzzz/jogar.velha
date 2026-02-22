import React, { useState, useEffect } from 'react';
import { Trophy, LogOut, Menu, X, Zap } from 'lucide-react';

export default function TicTacToe() {
  const [gameState, setGameState] = useState('auth');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [opponent, setOpponent] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [lastGameResult, setLastGameResult] = useState(null);

  // Carregar dados do localStorage
  useEffect(() => {
    const storedUsers = window.storage?.get ? null : localStorage.getItem('ticTacToeUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  // Salvar dados
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
    }
  }, [users]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const isBoardFull = (squares) => squares.every(square => square !== null);

  const handleLogin = () => {
    if (!usernameInput.trim()) return;
    
    let user = users.find(u => u.username === usernameInput.trim());
    if (!user) {
      user = {
        id: Date.now(),
        username: usernameInput.trim(),
        wins: 0,
        losses: 0,
        draws: 0,
        trophies: 0, // Moeda em vez de array
        stats: {
          totalGames: 0,
          streak: 0,
          bestStreak: 0,
        }
      };
      setUsers([...users, user]);
    }
    
    setCurrentUser(user);
    setGameState('menu');
    setUsernameInput('');
  };

  const handlePlayAgainstBot = () => {
    setOpponent('bot');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameState('playing');
  };

  const handlePlayMultiplayer = () => {
    setGameState('matchmaking');
  };

  const handleSelectOpponent = (user) => {
    setOpponent(user);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameState('playing');
  };

  const findFairOpponent = () => {
    const availableOpponents = users.filter(u => u.id !== currentUser.id);
    
    if (availableOpponents.length === 0) {
      return null;
    }

    // Ordena os oponentes por diferença de troféus
    const sortedByDifference = availableOpponents.sort((a, b) => {
      const diffA = Math.abs(a.trophies - currentUser.trophies);
      const diffB = Math.abs(b.trophies - currentUser.trophies);
      return diffA - diffB;
    });

    return sortedByDifference[0];
  };

  const handleClick = (index) => {
    if (board[index] || calculateWinner(board)) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const winner = calculateWinner(newBoard);
    const isFull = isBoardFull(newBoard);

    if (winner || isFull) {
      setTimeout(() => handleGameEnd(newBoard, winner), 500);
      return;
    }

    if (opponent === 'bot' && !isXNext) {
      setTimeout(() => makeAIMove(newBoard), 500);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const makeAIMove = (currentBoard) => {
    const emptySquares = currentBoard
      .map((val, idx) => val === null ? idx : null)
      .filter(val => val !== null);

    if (emptySquares.length === 0) return;

    // IA estratégica
    let bestMove = null;
    
    // Verificar se pode ganhar
    for (let idx of emptySquares) {
      const testBoard = [...currentBoard];
      testBoard[idx] = 'O';
      if (calculateWinner(testBoard) === 'O') {
        bestMove = idx;
        break;
      }
    }

    // Bloquear vitória do jogador
    if (!bestMove) {
      for (let idx of emptySquares) {
        const testBoard = [...currentBoard];
        testBoard[idx] = 'X';
        if (calculateWinner(testBoard) === 'X') {
          bestMove = idx;
          break;
        }
      }
    }

    // Centro ou canto
    if (!bestMove) {
      if (currentBoard[4] === null) bestMove = 4;
      else {
        const corners = [0, 2, 6, 8].filter(i => currentBoard[i] === null);
        bestMove = corners[Math.floor(Math.random() * corners.length)];
      }
    }

    // Movimento aleatório
    if (bestMove === null) {
      bestMove = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    const newBoard = [...currentBoard];
    newBoard[bestMove] = 'O';
    setBoard(newBoard);
    
    const winner = calculateWinner(newBoard);
    if (winner || isBoardFull(newBoard)) {
      setTimeout(() => handleGameEnd(newBoard, winner), 500);
    } else {
      setIsXNext(true);
    }
  };

  const handleGameEnd = (finalBoard, winner) => {
    let updatedUsers = [...users];
    let currentUserIdx = updatedUsers.findIndex(u => u.id === currentUser.id);
    let updatedUser = { ...updatedUsers[currentUserIdx] };
    let trophyChange = 0;

    if (opponent === 'bot') {
      // Contra IA: +3 vitória, -3 derrota, 0 empate
      if (winner === 'X') {
        updatedUser.wins += 1;
        updatedUser.stats.streak += 1;
        updatedUser.trophies += 3;
        trophyChange = 3;
        
        if (updatedUser.stats.streak > updatedUser.stats.bestStreak) {
          updatedUser.stats.bestStreak = updatedUser.stats.streak;
        }
      } else if (winner === 'O') {
        updatedUser.losses += 1;
        updatedUser.stats.streak = 0;
        updatedUser.trophies = Math.max(0, updatedUser.trophies - 3);
        trophyChange = -3;
      } else {
        updatedUser.draws += 1;
        updatedUser.stats.streak = 0;
        trophyChange = 0;
      }
      updatedUser.stats.totalGames += 1;
    } else {
      // Contra outro jogador: +30 vitória, -30 derrota, 0 empate
      let opponentIdx = updatedUsers.findIndex(u => u.id === opponent.id);
      
      if (winner === 'X') {
        updatedUser.wins += 1;
        updatedUser.stats.streak += 1;
        updatedUser.trophies += 30;
        trophyChange = 30;
        
        updatedUsers[opponentIdx].losses += 1;
        updatedUsers[opponentIdx].stats.streak = 0;
        updatedUsers[opponentIdx].trophies = Math.max(0, updatedUsers[opponentIdx].trophies - 30);
        
        if (updatedUser.stats.streak > updatedUser.stats.bestStreak) {
          updatedUser.stats.bestStreak = updatedUser.stats.streak;
        }
      } else if (winner === 'O') {
        updatedUser.losses += 1;
        updatedUser.stats.streak = 0;
        updatedUser.trophies = Math.max(0, updatedUser.trophies - 30);
        trophyChange = -30;
        
        updatedUsers[opponentIdx].wins += 1;
        updatedUsers[opponentIdx].stats.streak += 1;
        updatedUsers[opponentIdx].trophies += 30;
        
        if (updatedUsers[opponentIdx].stats.streak > updatedUsers[opponentIdx].stats.bestStreak) {
          updatedUsers[opponentIdx].stats.bestStreak = updatedUsers[opponentIdx].stats.streak;
        }
      } else {
        updatedUser.draws += 1;
        updatedUser.stats.streak = 0;
        updatedUsers[opponentIdx].draws += 1;
        updatedUsers[opponentIdx].stats.streak = 0;
        trophyChange = 0;
      }
      updatedUser.stats.totalGames += 1;
      updatedUsers[opponentIdx].stats.totalGames += 1;
    }

    updatedUsers[currentUserIdx] = updatedUser;
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
    setLastGameResult({ winner, trophyChange });
    setGameState('result');
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameState('menu');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setGameState('auth');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setShowMenu(false);
  };

  const winner = calculateWinner(board);
  const isFull = isBoardFull(board);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-['Segoe_UI',sans-serif] overflow-hidden">
      {/* Fundo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        {currentUser && (
          <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <div>
                <h1 className="font-bold text-lg">{currentUser.username}</h1>
                <p className="text-xs text-gray-400">{currentUser.wins}W - {currentUser.losses}L - {currentUser.draws}D</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg">
                <span className="text-xl">🏆</span>
                <span className="font-bold">{currentUser.trophies}</span>
              </div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition"
              >
                {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}

        {/* Menu Desktop */}
        {showMenu && (
          <div className="absolute top-16 right-4 bg-slate-800/95 backdrop-blur border border-purple-500/30 rounded-lg overflow-hidden z-50">
            <button
              onClick={() => { setGameState('profile'); setShowMenu(false); }}
              className="w-full px-4 py-2 text-left hover:bg-purple-500/20 transition"
            >
              📊 Perfil
            </button>
            <button
              onClick={() => { setGameState('rankings'); setShowMenu(false); }}
              className="w-full px-4 py-2 text-left hover:bg-purple-500/20 transition border-t border-purple-500/20"
            >
              🏆 Rankings
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left hover:bg-red-500/20 transition border-t border-purple-500/20 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="min-h-screen flex items-center justify-center p-4">
          {gameState === 'auth' && (
            <div className="max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  TIC TAC TOE
                </h1>
                <p className="text-gray-400">Multiplayer com Troféus</p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6 space-y-4">
                <input
                  type="text"
                  placeholder="Digite seu username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition text-white placeholder-gray-500"
                />
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-bold transition transform hover:scale-105"
                >
                  Entrar
                </button>
              </div>

              <div className="text-center text-sm text-gray-500">
                {users.length > 0 && (
                  <p>👥 {users.length} jogador{users.length !== 1 ? 'es' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          )}

          {gameState === 'menu' && (
            <div className="max-w-md w-full space-y-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2">Bem-vindo!</h2>
                <p className="text-gray-400">Escolha seu próximo desafio</p>
              </div>

              <button
                onClick={handlePlayAgainstBot}
                className="w-full p-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-bold transition transform hover:scale-105 text-lg"
              >
                🤖 Jogar contra IA
              </button>

              <button
                onClick={handlePlayMultiplayer}
                className="w-full p-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-bold transition transform hover:scale-105 text-lg"
              >
                👥 Jogar com Amigos
              </button>

              <button
                onClick={() => setGameState('profile')}
                className="w-full p-4 bg-slate-700/50 border border-purple-500/30 hover:bg-slate-700 rounded-xl font-bold transition"
              >
                📊 Meu Perfil
              </button>

              <button
                onClick={() => setGameState('rankings')}
                className="w-full p-4 bg-slate-700/50 border border-purple-500/30 hover:bg-slate-700 rounded-xl font-bold transition"
              >
                🏆 Rankings
              </button>
            </div>
          )}

          {gameState === 'matchmaking' && (
            <div className="max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black">Procurando Oponente...</h2>
                <p className="text-gray-400">Matchmaking Justo</p>
              </div>

              {(() => {
                const fairOpponent = findFairOpponent();
                
                if (!fairOpponent) {
                  return (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-gray-400">Nenhum oponente disponível no momento</p>
                      <button
                        onClick={() => setGameState('menu')}
                        className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                      >
                        Voltar
                      </button>
                    </div>
                  );
                }

                const trophyDifference = Math.abs(fairOpponent.trophies - currentUser.trophies);

                return (
                  <div className="space-y-6">
                    {/* Seu Perfil */}
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-6 text-center">
                      <p className="text-sm text-gray-400 mb-2">VOCÊ</p>
                      <p className="text-2xl font-black mb-3">{currentUser.username}</p>
                      <div className="flex justify-center items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-400">VITÓRIAS</p>
                          <p className="text-xl font-bold text-green-400">{currentUser.wins}</p>
                        </div>
                        <div className="w-px h-12 bg-purple-500/30"></div>
                        <div>
                          <p className="text-xs text-gray-400">TROFÉUS</p>
                          <p className="text-xl font-bold text-yellow-400">{currentUser.trophies}</p>
                        </div>
                      </div>
                    </div>

                    {/* Indicador de Equilíbrio */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex-1 h-1 bg-gradient-to-r from-purple-500 to-purple-500/30 rounded"></div>
                      <div className="text-center px-4">
                        <p className="text-xs text-gray-400 mb-1">DIFERENÇA</p>
                        <p className={`text-lg font-black ${
                          trophyDifference <= 10 ? 'text-green-400' : 
                          trophyDifference <= 50 ? 'text-yellow-400' : 
                          'text-orange-400'
                        }`}>
                          {trophyDifference} 🏆
                        </p>
                      </div>
                      <div className="flex-1 h-1 bg-gradient-to-l from-blue-500 to-blue-500/30 rounded"></div>
                    </div>

                    {/* Oponente */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-6 text-center">
                      <p className="text-sm text-gray-400 mb-2">OPONENTE</p>
                      <p className="text-2xl font-black mb-3">{fairOpponent.username}</p>
                      <div className="flex justify-center items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-400">VITÓRIAS</p>
                          <p className="text-xl font-bold text-green-400">{fairOpponent.wins}</p>
                        </div>
                        <div className="w-px h-12 bg-blue-500/30"></div>
                        <div>
                          <p className="text-xs text-gray-400">TROFÉUS</p>
                          <p className="text-xl font-bold text-yellow-400">{fairOpponent.trophies}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status do Match */}
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-2">STATUS DO MATCH</p>
                      <p className={`text-sm font-bold ${
                        trophyDifference <= 10 ? 'text-green-400' : 
                        trophyDifference <= 50 ? 'text-yellow-400' : 
                        'text-orange-400'
                      }`}>
                        {trophyDifference <= 10 ? '⭐ Match Perfeito!' : 
                         trophyDifference <= 50 ? '✨ Match Equilibrado' : 
                         '⚡ Match Desafiador'}
                      </p>
                    </div>

                    {/* Botões */}
                    <div className="space-y-3">
                      <button
                        onClick={() => handleSelectOpponent(fairOpponent)}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-bold transition transform hover:scale-105 text-lg"
                      >
                        ⚔️ Entrar em Batalha
                      </button>
                      <button
                        onClick={() => setGameState('menu')}
                        className="w-full py-3 bg-slate-700/50 border border-purple-500/30 hover:bg-slate-700 rounded-lg font-bold transition"
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {gameState === 'playing' && (
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black mb-2">
                  {opponent === 'bot' ? '🤖 vs IA' : `${currentUser.username} vs ${opponent.username}`}
                </h2>
                {winner ? (
                  <p className="text-xl font-bold text-yellow-400">
                    {winner === 'X' ? (opponent === 'bot' ? '🎉 Você venceu!' : `${currentUser.username} venceu!`) : `${opponent === 'bot' ? 'IA' : opponent.username} venceu!`}
                  </p>
                ) : isFull ? (
                  <p className="text-xl font-bold text-blue-400">🤝 Empate!</p>
                ) : (
                  <p className="text-lg">{isXNext ? 'X' : 'O'} joga agora</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-800/30 p-4 rounded-xl">
                {board.map((value, index) => (
                  <button
                    key={index}
                    onClick={() => handleClick(index)}
                    disabled={winner !== null || value !== null}
                    className={`aspect-square text-4xl font-black rounded-lg transition transform ${
                      value === 'X' ? 'text-purple-400' : value === 'O' ? 'text-blue-400' : ''
                    } ${
                      !value && !winner ? 'hover:bg-slate-700/50 cursor-pointer hover:scale-105' : ''
                    } bg-slate-700/30 border border-purple-500/20`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {(winner || isFull) && (
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-bold transition transform hover:scale-105"
                >
                  Nova Partida
                </button>
              )}
            </div>
          )}

          {gameState === 'profile' && (
            <div className="max-w-md w-full space-y-6">
              <h2 className="text-3xl font-black">Meu Perfil</h2>
              
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {currentUser.username}
                  </p>
                  <p className="text-gray-400 mt-2">Jogador desde hoje</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-2xl font-black text-green-400">{currentUser.wins}</p>
                    <p className="text-xs text-gray-400 mt-1">Vitórias</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-2xl font-black text-red-400">{currentUser.losses}</p>
                    <p className="text-xs text-gray-400 mt-1">Derrotas</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-2xl font-black text-blue-400">{currentUser.draws}</p>
                    <p className="text-xs text-gray-400 mt-1">Empates</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-yellow-200 mb-2">TROFÉUS (Moeda)</p>
                  <p className="text-4xl font-black text-yellow-300">{currentUser.trophies}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold">Estatísticas</p>
                  <div className="space-y-1 text-sm text-gray-400">
                    <p>• Total de partidas: {currentUser.stats.totalGames}</p>
                    <p>• Sequência atual: {currentUser.stats.streak} vitória{currentUser.stats.streak !== 1 ? 's' : ''}</p>
                    <p>• Melhor sequência: {currentUser.stats.bestStreak}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-purple-500/20">
                  <p>💡 Contra IA: +3 vitória / -3 derrota</p>
                  <p>💡 Contra jogadores: +30 vitória / -30 derrota</p>
                  <p>💡 Empates não dão nem tiram troféus</p>
                </div>
              </div>

              <button
                onClick={() => setGameState('menu')}
                className="w-full py-3 bg-slate-700/50 border border-purple-500/30 hover:bg-slate-700 rounded-lg font-bold transition"
              >
                Voltar
              </button>
            </div>
          )}

          {gameState === 'rankings' && (
            <div className="max-w-md w-full space-y-4">
              <h2 className="text-3xl font-black">🏆 Rankings</h2>
              
              <div className="space-y-2">
                {[...users]
                  .sort((a, b) => b.trophies - a.trophies)
                  .map((user, idx) => (
                    <div
                      key={user.id}
                      className={`flex justify-between items-center p-4 rounded-lg border ${
                        user.id === currentUser.id
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-slate-700/30 border-slate-600/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl font-black">{idx + 1}.</span>
                        <div>
                          <p className="font-bold">{user.username}</p>
                          <p className="text-xs text-gray-400">{user.wins}W - {user.losses}L</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg">
                        <span>🏆</span>
                        <span className="font-bold">{user.trophies}</span>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setGameState('menu')}
                className="w-full py-3 bg-slate-700/50 border border-purple-500/30 hover:bg-slate-700 rounded-lg font-bold transition"
              >
                Voltar
              </button>
            </div>
          )}

          {gameState === 'result' && (
            <div className="max-w-md w-full text-center space-y-6">
              <div className="text-6xl mb-4">
                {lastGameResult?.winner === 'X' ? '🎉' : lastGameResult?.winner ? '😢' : '🤝'}
              </div>
              
              {lastGameResult?.winner === 'X' && (
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-green-400">Você Venceu!</h2>
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-xs text-yellow-200 mb-2">TROFÉUS GANHOS</p>
                    <p className="text-3xl font-black text-yellow-300">+{lastGameResult.trophyChange}</p>
                  </div>
                </div>
              )}
              
              {lastGameResult?.winner === 'O' && (
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-red-400">Você Perdeu!</h2>
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <p className="text-xs text-red-200 mb-2">TROFÉUS PERDIDOS</p>
                    <p className="text-3xl font-black text-red-300">{lastGameResult.trophyChange}</p>
                  </div>
                </div>
              )}
              
              {!lastGameResult?.winner && (
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-blue-400">Empate!</h2>
                  <p className="text-gray-400">Nenhum troféu foi ganho ou perdido</p>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-bold transition transform hover:scale-105"
              >
                Voltar ao Menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}