import React from 'react';
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
import CheckoutScreen from '../screens/user/CheckoutScreen';
import { theme } from '../theme';

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
  return (
    <NavigationContainer theme={MyDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
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
        <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
