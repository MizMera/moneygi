import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Build,
  Inventory,
  PictureAsPdf
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    revenusJour: 0,
    revenusHier: 0,
    depensesJour: 0,
    ventesJour: 0,
    reparationsEnCours: 0,
    stockFaible: 0,
    coutsJour: 0, // Nouveau
  });
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  // New UI data
  const [recentTx, setRecentTx] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [repairCounts, setRepairCounts] = useState({ recus: 0, enCours: 0, termines: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const generateDashboardPDF = async () => {
    const doc = new jsPDF();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Header
    doc.setFontSize(18);
    doc.text('Tableau de Bord', 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 32);
    if (user?.email) doc.text(`Généré par: ${user.email}`, 14, 40);

    // Key metrics
    doc.setFontSize(14);
    doc.text('Métriques Clés du Jour:', 14, 56);
    doc.setFontSize(11);
    
    const profit = stats.revenusJour - stats.coutsJour;
    const margin = stats.revenusJour > 0 ? ((profit / stats.revenusJour) * 100) : 0;
    const yesterdayComparison = stats.revenusJour - stats.revenusHier;
    const yesterdayPercent = stats.revenusHier > 0 ? ((yesterdayComparison / stats.revenusHier) * 100) : 0;
    
    doc.text(`Revenus aujourd'hui: ${stats.revenusJour.toFixed(2)} €`, 20, 68);
    doc.text(`Revenus hier: ${stats.revenusHier.toFixed(2)} €`, 20, 76);
    doc.text(`Variation vs hier: ${yesterdayComparison >= 0 ? '+' : ''}${yesterdayComparison.toFixed(2)} € (${yesterdayPercent >= 0 ? '+' : ''}${yesterdayPercent.toFixed(1)}%)`, 20, 84);
    doc.text(`Coûts du jour: ${stats.coutsJour.toFixed(2)} €`, 20, 92);
    doc.text(`Profit net: ${profit.toFixed(2)} €`, 20, 100);
    doc.text(`Marge: ${margin.toFixed(1)}%`, 20, 108);
    doc.text(`Dépenses du jour: ${stats.depensesJour.toFixed(2)} €`, 20, 116);
    
    doc.setFontSize(14);
    doc.text('État des Opérations:', 14, 134);
    doc.setFontSize(11);
    doc.text(`Réparations en cours: ${stats.reparationsEnCours}`, 20, 146);
    doc.text(`Produits en stock faible: ${stats.stockFaible}`, 20, 154);
    doc.text(`Nombre de ventes aujourd'hui: ${stats.ventesJour}`, 20, 162);

    // Recent trend (if graph data available)
    if (graphData.length > 0) {
      doc.setFontSize(14);
      doc.text('Tendance des 7 derniers jours:', 14, 180);
      
      // Simple table with daily revenues
      const tableData = graphData.slice(-7).map(day => [
        day.date,
        `${day.revenus.toFixed(2)} €`,
        `${day.depenses.toFixed(2)} €`,
        `${(day.revenus - day.depenses).toFixed(2)} €`
      ]);
      autoTable(doc, {
        startY: 186,
        head: [['Date', 'Revenus', 'Dépenses', 'Net']],
        body: tableData,
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' }
        }
      });
    }

    doc.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const aujourdhui = new Date().toISOString().split('T')[0];
      const hier = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const { data: revenusJour } = await supabase
        .from('transactions')
        .select('montant')
        .eq('type', 'Revenu')
        .gte('created_at', aujourdhui);
      const { data: revenusHier } = await supabase
        .from('transactions')
        .select('montant')
        .eq('type', 'Revenu')
        .gte('created_at', hier)
        .lt('created_at', aujourdhui);
      const { data: depensesJour } = await supabase
        .from('transactions')
        .select('montant')
        .eq('type', 'Dépense')
        .gte('created_at', aujourdhui);
      // Nouveau: récupérer aussi le cout_total des revenus du jour
      const { data: coutsJour } = await supabase
        .from('transactions')
        .select('cout_total')
        .eq('type', 'Revenu')
        .gte('created_at', aujourdhui);
      const { data: reparations } = await supabase
        .from('fiches_reparation')
        .select('id, statut')
        .in('statut', ['Reçu', 'En cours', 'Terminé']);
      // Detailed low stock list
      const { data: stockFaibleList } = await supabase
        .from('inventaire')
        .select('id, nom, quantite_stock')
        .lt('quantite_stock', 5)
        .order('quantite_stock', { ascending: true })
        .limit(5);
      // Recent transactions
      const { data: txRecent } = await supabase
        .from('transactions')
        .select('id, type, montant, created_at, description')
        .order('created_at', { ascending: false })
        .limit(8);

      const graphique = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        const nextDate = new Date(Date.now() - (i - 1) * 86400000).toISOString().split('T')[0];
        const { data: revenus } = await supabase
          .from('transactions')
          .select('montant')
          .eq('type', 'Revenu')
          .gte('created_at', date)
          .lt('created_at', nextDate);
        const total = revenus?.reduce((sum, t) => sum + t.montant, 0) || 0;
        graphique.push({
          date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
          revenus: total
        });
      }

      setStats({
        revenusJour: revenusJour?.reduce((s, t) => s + t.montant, 0) || 0,
        revenusHier: revenusHier?.reduce((s, t) => s + t.montant, 0) || 0,
        depensesJour: depensesJour?.reduce((s, t) => s + t.montant, 0) || 0,
        ventesJour: revenusJour?.length || 0,
        reparationsEnCours: reparations?.filter(r => r.statut === 'En cours').length || 0,
        stockFaible: stockFaibleList?.length || 0,
        coutsJour: coutsJour?.reduce((s, t) => s + (t.cout_total || 0), 0) || 0,
      });
      setGraphData(graphique);
      setRecentTx(txRecent || []);
      setLowStock(stockFaibleList || []);
      const counts = {
        recus: reparations?.filter(r => r.statut === 'Reçu').length || 0,
        enCours: reparations?.filter(r => r.statut === 'En cours').length || 0,
        termines: reparations?.filter(r => r.statut === 'Terminé').length || 0,
      };
      setRepairCounts(counts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card sx={{ height: '100%', p: 1, boxShadow: '0 6px 18px rgba(99, 102, 241, 0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline" sx={{ fontSize: '0.75rem', letterSpacing: 0.6 }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 800, color }}>
              {typeof value === 'number' ? value.toFixed(2) : value}
              {title.includes('Revenus') || title.includes('Dépenses') || title.includes('Coûts') || title.includes('Bénéfice') ? ' €' : ''}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend !== undefined && (
                  trend > 0 ? 
                    <TrendingUp sx={{ color: '#22C55E', mr: 0.5, fontSize: '1rem' }} /> : 
                    <TrendingDown sx={{ color: '#EF4444', mr: 0.5, fontSize: '1rem' }} />
                )}
                <Typography variant="body2" color="textSecondary">
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const trendRevenu = stats.revenusHier > 0 ? ((stats.revenusJour - stats.revenusHier) / stats.revenusHier) * 100 : 0;
  const beneficeBrut = stats.revenusJour - stats.coutsJour;
  const beneficeNet = beneficeBrut - stats.depensesJour;

  const handleExportPDF = () => {
    try {
      console.log('Starting Dashboard PDF export...');
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text('Rapport Journalier - Tableau de Bord', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
      
      console.log('Header added, creating summary...');
      
      // Financial Summary
      doc.setFontSize(12);
      doc.text('Résumé Financier', 14, 45);
      
      const summaryData = [
        ['Revenus Aujourd\'hui', `${stats.revenusJour.toFixed(2)} €`],
        ['Coûts des Ventes', `${stats.coutsJour.toFixed(2)} €`],
        ['Dépenses', `${stats.depensesJour.toFixed(2)} €`],
        ['Bénéfice Net', `${(stats.revenusJour - stats.coutsJour - stats.depensesJour).toFixed(2)} €`],
        ['Ventes Réalisées', stats.ventesJour.toString()],
        ['Réparations en Cours', stats.reparationsEnCours.toString()],
        ['Stock Faible', stats.stockFaible.toString()]
      ];
      
      console.log('Summary data prepared, creating table...');
      
      autoTable(doc, {
        startY: 55,
        head: [['Indicateur', 'Valeur']],
        body: summaryData,
        styles: { fontSize: 10 }
      });
      
      console.log('Table created, saving PDF...');
      
      const filename = `dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('PDF saved:', filename);
      
    } catch (error) {
      console.error('Error generating Dashboard PDF:', error);
      alert('Erreur lors de la génération du PDF: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 100px)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 3, mx: { xs: 0, sm: -2, md: -3 }, overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 3 }, flexWrap: 'wrap', rowGap: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 0 }}>
          Tableau de Bord
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PictureAsPdf />}
          onClick={handleExportPDF}
        >
          Export PDF
        </Button>
      </Box>

      {/* Main Content - Full width, page scroll */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, sm: 3 }, pb: 2 }}>
        {/* Stats Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Revenus Aujourd'hui" value={stats.revenusJour} subtitle={`${trendRevenu.toFixed(1)}% vs hier`} icon={<Euro />} color="#6366F1" trend={trendRevenu} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Coûts des Ventes Aujourd'hui" value={stats.coutsJour} subtitle="Coût des biens vendus" icon={<TrendingDown />} color="#0ea5e9" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Dépenses Aujourd'hui" value={stats.depensesJour} subtitle="Total dépensé" icon={<TrendingDown />} color="#EF4444" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Bénéfice Net Aujourd'hui" value={beneficeNet} subtitle="Revenus - Coûts - Dépenses" icon={<Euro />} color={beneficeNet > 0 ? '#22C55E' : '#EF4444'} />
          </Grid>
        </Grid>

        {/* Charts + Activity */}
        <Grid container spacing={3} sx={{ flex: 1 }}>
          <Grid item xs={12} md={7} lg={8}>
            <Paper sx={{ 
              p: { xs: 2, sm: 3 }, 
              height: '100%',
              minHeight: { xs: 280, sm: 340, md: 400 },
              boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" gutterBottom>
                Revenus des 7 derniers jours
              </Typography>
              <Box sx={{ flex: 1, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} €`, 'Revenus']} />
                    <Line type="monotone" dataKey="revenus" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5} lg={4}>
            <Paper sx={{ 
              p: { xs: 2, sm: 3 }, 
              height: '100%',
              minHeight: { xs: 280, sm: 340, md: 400 },
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '0 8px 24px rgba(15,23,42,0.06)' 
            }}>
              <Typography variant="h6" gutterBottom>
                Activité Récente
              </Typography>
              <List dense sx={{ flex: 1, overflow: 'auto' }}>
                {recentTx.map(tx => (
                  <Box key={tx.id} component="li">
                    <ListItem secondaryAction={<Typography sx={{ fontWeight: 700 }}>{Number(tx.montant).toFixed(2)} €</Typography>}>
                      <ListItemText
                        primary={tx.description || (tx.type === 'Revenu' ? 'Encaissement' : 'Dépense')}
                        secondary={`${new Date(tx.created_at).toLocaleDateString('fr-FR')} ${new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                      />
                      <Chip size="small" label={tx.type} color={tx.type === 'Revenu' ? 'success' : 'error'} sx={{ ml: 1 }} />
                    </ListItem>
                    <Divider />
                  </Box>
                ))}
                {recentTx.length === 0 && (
                  <Typography color="text.secondary">Aucune activité récente.</Typography>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Bottom: Stock & Repairs */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
              <Typography variant="h6" gutterBottom>Stocks Faibles</Typography>
              <List dense>
                {lowStock.map(p => (
                  <ListItem key={p.id}>
                    <ListItemText primary={p.nom} secondary={`Stock: ${p.quantite_stock}`} />
                  </ListItem>
                ))}
                {lowStock.length === 0 && (
                  <Typography color="text.secondary">Aucun article en faible stock.</Typography>
                )}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
              <Typography variant="h6" gutterBottom>Réparations</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip icon={<Build />} label={`Reçu: ${repairCounts.recus}`} />
                <Chip icon={<Build />} color="info" label={`En cours: ${repairCounts.enCours}`} />
                <Chip icon={<Build />} color="success" label={`Terminé: ${repairCounts.termines}`} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;