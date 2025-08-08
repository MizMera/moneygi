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
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Build,
  Inventory
} from '@mui/icons-material';
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
    stockFaible: 0
  });
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      const { data: reparations } = await supabase
        .from('fiches_reparation')
        .select('id')
        .in('statut', ['Reçu', 'En cours']);
      const { data: stockFaible } = await supabase
        .from('inventaire')
        .select('id')
        .lt('quantite_stock', 5);

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
        graphique.push({
          date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
          revenus: revenus?.reduce((sum, t) => sum + t.montant, 0) || 0
        });
      }

      setStats({
        revenusJour: revenusJour?.reduce((s, t) => s + t.montant, 0) || 0,
        revenusHier: revenusHier?.reduce((s, t) => s + t.montant, 0) || 0,
        depensesJour: depensesJour?.reduce((s, t) => s + t.montant, 0) || 0,
        ventesJour: revenusJour?.length || 0,
        reparationsEnCours: reparations?.length || 0,
        stockFaible: stockFaible?.length || 0
      });
      setGraphData(graphique);
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
              {title.includes('Revenus') || title.includes('Dépenses') ? ' €' : ''}
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
        Tableau de Bord
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Revenus Aujourd'hui" value={stats.revenusJour} subtitle={`${trendRevenu.toFixed(1)}% vs hier`} icon={<Euro />} color="#6366F1" trend={trendRevenu} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Dépenses Aujourd'hui" value={stats.depensesJour} subtitle="Total dépensé" icon={<TrendingDown />} color="#EF4444" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Réparations en Cours" value={stats.reparationsEnCours} subtitle="Fiches actives" icon={<Build />} color="#06B6D4" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Stock Faible" value={stats.stockFaible} subtitle="Articles < 5 unités" icon={<Inventory />} color="#F59E0B" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <Typography variant="h6" gutterBottom>
              Revenus des 7 derniers jours
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} €`, 'Revenus']} />
                <Line type="monotone" dataKey="revenus" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <Typography variant="h6" gutterBottom textAlign="center">
              Bénéfice Net Aujourd'hui
            </Typography>
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="h2" sx={{ fontWeight: 800, color: stats.revenusJour - stats.depensesJour > 0 ? '#22C55E' : '#EF4444', mb: 2 }}>
                {(stats.revenusJour - stats.depensesJour).toFixed(2)} €
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Revenus - Dépenses
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#F1F5F9', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Revenus: {stats.revenusJour.toFixed(2)} €
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Dépenses: {stats.depensesJour.toFixed(2)} €
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;