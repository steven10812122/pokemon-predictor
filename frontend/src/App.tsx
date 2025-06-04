import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Typography, 
  CircularProgress,
  ThemeProvider,
  createTheme,
  Card,
  CardContent,
  Fade,
  Chip,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

// 創建寶可夢主題
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF0000', // 寶可夢紅
      dark: '#CC0000',
    },
    secondary: {
      main: '#3B4CCA', // 寶可夢藍
    },
    background: {
      default: '#FFDE00', // 寶可夢黃
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Game Font", "Segoe UI", "Roboto", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '1px',
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
});

// 自定義樣式組件
const PokemonPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  border: '8px solid #3B4CCA',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '-12px',
    width: '24px',
    height: '24px',
    backgroundColor: '#FF0000',
    borderRadius: '50%',
    transform: 'translateY(-50%)',
    border: '4px solid #CC0000',
  },
}));

const PreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '300px',
  objectFit: 'contain',
  borderRadius: '16px',
  border: '4px solid #3B4CCA',
  backgroundColor: '#f0f0f0',
  padding: '8px',
});

const PokemonButton = styled(Button)(({ theme }) => ({
  height: '48px',
  borderRadius: '24px',
  fontWeight: 'bold',
  fontSize: '1.1rem',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  background: 'linear-gradient(45deg, #FF0000 30%, #FF4444 90%)',
  boxShadow: '0 4px 8px rgba(255, 0, 0, 0.3)',
  border: '2px solid #CC0000',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(255, 0, 0, 0.4)',
  },
})) as typeof Button;

const ResultCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
  border: '4px solid #3B4CCA',
  borderRadius: '16px',
  position: 'relative',
  overflow: 'visible',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-12px',
    right: '-12px',
    width: '32px',
    height: '32px',
    backgroundColor: '#FFDE00',
    borderRadius: '50%',
    border: '4px solid #3B4CCA',
  },
}));

interface Pokemon {
  name: string;
  name_en: string;
  name_jp?: string;
  generation?: string;
  types?: string[];
  index?: string;
}

interface PokemonList {
  [key: string]: Pokemon;
}

// 新增類型標籤的顏色映射
const typeColors: { [key: string]: { main: string, light: string } } = {
  一般: { main: '#A8A878', light: '#C6C6A7' },
  火: { main: '#F08030', light: '#F5AC78' },
  水: { main: '#6890F0', light: '#9DB7F5' },
  電: { main: '#F8D030', light: '#FAE078' },
  草: { main: '#78C850', light: '#A7DB8D' },
  冰: { main: '#98D8D8', light: '#BCE6E6' },
  格鬥: { main: '#C03028', light: '#D67873' },
  毒: { main: '#A040A0', light: '#C183C1' },
  地面: { main: '#E0C068', light: '#EBD69D' },
  飛行: { main: '#A890F0', light: '#C6B7F5' },
  超能力: { main: '#F85888', light: '#FA92B2' },
  蟲: { main: '#A8B820', light: '#C6D16E' },
  岩石: { main: '#B8A038', light: '#D1C17D' },
  幽靈: { main: '#705898', light: '#A292BC' },
  龍: { main: '#7038F8', light: '#A27DFA' },
  惡: { main: '#705848', light: '#A29288' },
  鋼: { main: '#B8B8D0', light: '#D1D1E0' },
  妖精: { main: '#EE99AC', light: '#F4BDC9' },
};

// 自定義類型標籤組件
const TypeChip = styled(Chip)<{ pokemontype: keyof typeof typeColors }>(({ theme, pokemontype }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: typeColors[pokemontype]?.main || '#A8A878',
  color: 'white',
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: typeColors[pokemontype]?.light || '#C6C6A7',
  },
}));

// 寶可夢資訊卡片
const PokemonCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
  border: '4px solid #3B4CCA',
  borderRadius: '16px',
  position: 'relative',
  overflow: 'visible',
  marginTop: theme.spacing(3),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-12px',
    left: '-12px',
    width: '32px',
    height: '32px',
    backgroundColor: '#FF0000',
    borderRadius: '50%',
    border: '4px solid #CC0000',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-12px',
    right: '-12px',
    width: '32px',
    height: '32px',
    backgroundColor: '#FFDE00',
    borderRadius: '50%',
    border: '4px solid #3B4CCA',
  },
}));

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [prediction, setPrediction] = useState<string>('');
  const [chineseName, setChineseName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pokemonList, setPokemonList] = useState<PokemonList>({});

  useEffect(() => {
    // 載入寶可夢清單
    console.log('開始載入寶可夢清單...');
    fetch('/pokemon_full_list.json')
      .then(response => {
        console.log('收到回應:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('收到資料，長度:', data.length);
        // 將資料轉換為以英文名稱為key的物件（轉換為小寫）
        const pokemonMap = data.reduce((acc: PokemonList, pokemon: any) => {
          acc[pokemon.name_en.toLowerCase()] = pokemon;
          return acc;
        }, {});
        console.log('處理後的資料:', Object.keys(pokemonMap).length, '個寶可夢');
        console.log('第一個寶可夢範例:', Object.values(pokemonMap)[0]);
        setPokemonList(pokemonMap);
      })
      .catch(error => {
        console.error('載入寶可夢清單時發生錯誤:', error);
        setError('載入寶可夢資料失敗');
      });
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction('');
      setChineseName('');
      setError('');
    }
  };

  // 修改查找函數的返回型別
  const findMatchingPokemon = (predictedLabel: string): Pokemon => {
    // 將預測標籤轉換為小寫
    const lowercaseLabel = predictedLabel.toLowerCase();
    
    // 1. 先嘗試完全匹配
    if (pokemonList[lowercaseLabel]) {
      return pokemonList[lowercaseLabel];
    }

    // 2. 獲取連字符前的基本名稱
    const baseName = lowercaseLabel.split('-')[0];
    
    // 3. 遍歷所有寶可夢尋找匹配
    for (const key in pokemonList) {
      // 檢查是否匹配基本名稱
      if (key.toLowerCase().startsWith(baseName)) {
        return pokemonList[key];
      }
    }

    // 4. 如果還是沒找到，返回未知寶可夢
    console.log('未找到匹配的寶可夢，原始標籤:', predictedLabel, '基本名稱:', baseName);
    return {
      name: "未知寶可夢",
      name_en: predictedLabel,
      types: ["未知"],
    };
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError('請先選擇一張圖片');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const predictedLabel = response.data.predicted_label;
      console.log('收到預測結果:', predictedLabel);

      // 使用新的查找函數
      const matchedPokemon = findMatchingPokemon(predictedLabel);
      console.log('匹配結果:', matchedPokemon);
      
      if (matchedPokemon.name !== "未知寶可夢") {
        console.log('找到匹配的寶可夢:', matchedPokemon);
        setPrediction(matchedPokemon.name_en);
        setChineseName(matchedPokemon.name);
      } else {
        console.log('未找到匹配的寶可夢，使用原始預測標籤:', predictedLabel);
        setPrediction(predictedLabel);
        setChineseName('未知寶可夢');
      }

    } catch (err) {
      setError('預測失敗，請稍後再試');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `url('/pokeball-pattern.svg') repeat, linear-gradient(135deg, #FFDE00 0%, #FFF5B8 100%)`,
        py: 6,
        position: 'relative',
      }}>
        <Container maxWidth="sm">
          <Fade in={true} timeout={800}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                align="center" 
                sx={{ 
                  mb: 4,
                  color: '#FF0000',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                  WebkitTextStroke: '1px #CC0000',
                  letterSpacing: '2px'
                }}
              >
                寶可夢預測器
              </Typography>

              <PokemonPaper>
                <Box sx={{ mb: 4 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="contained"
                      component="span"
                      fullWidth
                      sx={{
                        height: '48px',
                        borderRadius: '24px',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        background: 'linear-gradient(45deg, #FF0000 30%, #FF4444 90%)',
                        boxShadow: '0 4px 8px rgba(255, 0, 0, 0.3)',
                        border: '2px solid #CC0000',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 12px rgba(255, 0, 0, 0.4)',
                        },
                      }}
                    >
                      選擇寶可夢圖片
                    </Button>
                  </label>
                </Box>

                {previewUrl && (
                  <Fade in={true} timeout={500}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                      <PreviewImage
                        src={previewUrl}
                        alt="預覽"
                      />
                    </Box>
                  </Fade>
                )}

                <PokemonButton
                  variant="contained"
                  fullWidth
                  onClick={handlePredict}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                      <span>尋找寶可夢中...</span>
                    </Box>
                  ) : (
                    '開始預測'
                  )}
                </PokemonButton>

                {error && (
                  <Typography 
                    color="error" 
                    align="center" 
                    sx={{ 
                      mt: 2,
                      p: 2,
                      bgcolor: 'rgba(255,0,0,0.1)',
                      borderRadius: 2,
                      border: '2px solid #FF0000'
                    }}
                  >
                    {error}
                  </Typography>
                )}

                {prediction && (
                  <Fade in={true} timeout={800}>
                    <PokemonCard>
                      <CardContent>
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                          <Typography 
                            variant="h6" 
                            align="center"
                            gutterBottom
                            sx={{
                              color: '#3B4CCA',
                              fontWeight: 'bold',
                              mb: 3
                            }}
                          >
                            發現寶可夢！
                          </Typography>

                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 2,
                          }}>
                            {/* 名稱區域 */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center',
                              flexWrap: 'wrap',
                              gap: 2 
                            }}>
                              <Box 
                                sx={{ 
                                  color: '#FF0000',
                                  fontWeight: 'bold',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                                  typography: 'h5'
                                }}
                              >
                                {chineseName}
                              </Box>
                              
                              <Box 
                                sx={{ 
                                  color: '#3B4CCA',
                                  fontWeight: 'bold',
                                  typography: 'h5'
                                }}
                              >
                                {prediction}
                              </Box>
                            </Box>

                            {/* 只在找到完整匹配時顯示額外資訊 */}
                            {pokemonList[prediction.toLowerCase()] && (
                              <>
                                {/* 資訊區域 */}
                                <Box sx={{ 
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  gap: 2,
                                  flexWrap: 'wrap'
                                }}>
                                  {pokemonList[prediction.toLowerCase()]?.index && (
                                    <Box 
                                      sx={{ 
                                        bgcolor: '#f0f0f0',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        py: 1,
                                        px: 2,
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      #{pokemonList[prediction.toLowerCase()].index}
                                    </Box>
                                  )}
                                  
                                  {pokemonList[prediction.toLowerCase()]?.generation && (
                                    <Box 
                                      sx={{ 
                                        bgcolor: '#FFDE00',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        py: 1,
                                        px: 2,
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      {pokemonList[prediction.toLowerCase()].generation}
                                    </Box>
                                  )}
                                </Box>

                                {/* 屬性區域 */}
                                <Box sx={{ 
                                  display: 'flex',
                                  justifyContent: 'center',
                                  flexWrap: 'wrap',
                                  gap: 1
                                }}>
                                  {pokemonList[prediction.toLowerCase()]?.types?.map((type, index) => {
                                    if (type in typeColors) {
                                      return (
                                        <Box
                                          key={index}
                                          sx={{
                                            bgcolor: typeColors[type as keyof typeof typeColors].main,
                                            color: 'white',
                                            fontWeight: 'bold',
                                            py: 1,
                                            px: 2,
                                            borderRadius: '16px',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                              bgcolor: typeColors[type as keyof typeof typeColors].light,
                                            }
                                          }}
                                        >
                                          {type}
                                        </Box>
                                      );
                                    }
                                    return null;
                                  })}
                                </Box>
                              </>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </PokemonCard>
                  </Fade>
                )}
              </PokemonPaper>
            </Box>
          </Fade>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
