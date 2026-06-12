import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserDashboard from '../screens/user/UserDashboard';
import ManageLedgers from '../screens/admin/ManageLedgers';
import ReceivePayment from '../screens/admin/ReceivePayment';
import ManageProducts from '../screens/admin/ManageProducts';
import CreateInvoice from '../screens/admin/CreateInvoice';
import ReportsDashboard from '../screens/admin/ReportsDashboard';
import ManageInvoices from '../screens/admin/ManageInvoices';
import PendingOrders from '../screens/admin/PendingOrders';
import ManageVendors from '../screens/admin/ManageVendors';
import RawMaterials from '../screens/admin/RawMaterials';
import PurchaseEntry from '../screens/admin/PurchaseEntry';
import ManufacturingEntry from '../screens/admin/ManufacturingEntry';
import CostingReport from '../screens/admin/CostingReport';
import ManageEmployees from '../screens/admin/ManageEmployees';
import AttendanceWages from '../screens/admin/AttendanceWages';
import FactoryExpenses from '../screens/admin/FactoryExpenses';
import FinancialAnalytics from '../screens/admin/FinancialAnalytics';
import InvoicePreview from '../screens/admin/InvoicePreview';
import ManageDeliveries from '../screens/admin/ManageDeliveries';
import CheckoutScreen from '../screens/user/CheckoutScreen';
import DriverDashboard from '../screens/driver/DriverDashboard';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';

const Stack = createNativeStackNavigator();

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (!error && data) {
        setRole(data.role);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : role === 'Admin' || role === 'Floor Manager' ? (
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="ManageLedgers" component={ManageLedgers} />
            <Stack.Screen name="ReceivePayment" component={ReceivePayment} />
            <Stack.Screen name="ManageProducts" component={ManageProducts} />
            <Stack.Screen name="CreateInvoice" component={CreateInvoice} />
            <Stack.Screen name="ReportsDashboard" component={ReportsDashboard} />
            <Stack.Screen name="ManageInvoices" component={ManageInvoices} />
            <Stack.Screen name="PendingOrders" component={PendingOrders} />
            <Stack.Screen name="ManageVendors" component={ManageVendors} />
            <Stack.Screen name="RawMaterials" component={RawMaterials} />
            <Stack.Screen name="PurchaseEntry" component={PurchaseEntry} />
            <Stack.Screen name="ManufacturingEntry" component={ManufacturingEntry} />
            <Stack.Screen name="CostingReport" component={CostingReport} />
            <Stack.Screen name="ManageEmployees" component={ManageEmployees} />
            <Stack.Screen name="AttendanceWages" component={AttendanceWages} />
            <Stack.Screen name="FactoryExpenses" component={FactoryExpenses} />
            <Stack.Screen name="FinancialAnalytics" component={FinancialAnalytics} />
            <Stack.Screen name="InvoicePreview" component={InvoicePreview} />
            <Stack.Screen name="ManageDeliveries" component={ManageDeliveries} />
          </>
        ) : role === 'Driver' ? (
          <>
            <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
          </>
        ) : (
          <>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
