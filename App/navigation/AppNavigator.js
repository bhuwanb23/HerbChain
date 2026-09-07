/**
 * AppNavigator — Phase A1 navigation un-orphaning.
 *
 * Every existing screen file is now reachable through proper role navigation.
 * Per-role bottom tabs match docs/app/overview.md. Feature-flagged screens
 * (prices, weather, trainings, payments) render a ComingSoon placeholder.
 *
 * Role guard: logged-out → auth stack only; logged-in → role-specific tab set;
 * wrong-role deep link → role home with no crash.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { GlobalTranslationProvider } from '../language/GlobalTranslationContext';
import { useAuth } from '../contexts/AuthContext';
import { isEnabled } from '../constants/featureFlags';

// ─── Auth screens ───────────────────────────────────────────────────────────
import PerfectLoginScreen from '../pages/login/PerfectLoginScreen';
import RegisterScreen from '../pages/login/RegisterScreen';

// ─── Shared screens (A1 stubs, filled in A6) ───────────────────────────────
import NotificationsScreen from '../pages/shared/NotificationsScreen';
import SupportScreen from '../pages/shared/SupportScreen';
import SettingsScreen from '../pages/shared/SettingsScreen';
import OfflineSyncScreen from '../pages/shared/OfflineSyncScreen';
import ComingSoonScreen from '../pages/shared/ComingSoonScreen';

// ─── Farmer screens ─────────────────────────────────────────────────────────
import FarmerHome from '../pages/users/farmers/FarmerHome';
import BatchList from '../pages/users/farmers/batches/BatchList';
import BatchDetail from '../pages/users/farmers/batches/BatchDetail';
import TransferRequests from '../pages/users/farmers/batches/TransferRequests';
import FarmerQR from '../pages/users/farmers/batches/FarmerQR';
import FarmProfileScreen from '../pages/users/farmers/farm_profile/FarmProfileScreen';
import CatalogueScreen from '../pages/users/farmers/catalogue/CatalogueScreen';
import CatalogueDetailScreen from '../pages/users/farmers/catalogue/CatalogueDetailScreen';
import CropCalendarScreen from '../pages/users/farmers/crop_calendar/CropCalendarScreen';
import SmartRegisterScreen from '../pages/users/farmers/smart_register/SmartRegisterScreen';
import WeatherScreen from '../pages/users/farmers/weather/WeatherScreen';
import PricesScreen from '../pages/users/farmers/prices/PricesScreen';
import BatchSplitScreen from '../pages/users/farmers/batch_split/BatchSplitScreen';
import FarmerNotifications from '../pages/users/farmers/notifications/notifications';
import FarmerPayments from '../pages/users/farmers/payments/payements';
import FarmerProfile from '../pages/users/farmers/profile/profile';
import FarmerTraining from '../pages/users/farmers/trainings/training';
import FarmerDashboard from '../pages/users/farmers/dashboard/dashboard';
import HerbRegisterScreen from '../pages/users/farmers/herb_register/HerbRegisterScreen';
import HerbListScreen from '../pages/users/farmers/herb_register/HerbListScreen';
import HerbDetailsScreen from '../pages/users/farmers/herb_register/HerbDetailsScreen';

// ─── Transporter screens ────────────────────────────────────────────────────
import TransporterHome from '../pages/users/transporters/TransporterHome';
import TransporterDashboard from '../pages/users/transporters/dashboard/dashboard';
import TripsPage from '../pages/users/transporters/trips/index';
import TransporterPayments from '../pages/users/transporters/payments/payments';
import TransporterProfile from '../pages/users/transporters/profile/profile';
import TransporterReports from '../pages/users/transporters/reports/reports';
import ShipmentDetail from '../pages/users/transporters/shipment/ShipmentDetail';
import PickupCapture from '../pages/users/transporters/shipment/PickupCapture';
import DeliveryConfirm from '../pages/users/transporters/shipment/DeliveryConfirm';
import DeliveryFailure from '../pages/users/transporters/shipment/DeliveryFailure';

// ─── Lab screens ────────────────────────────────────────────────────────────
import LabHome from '../pages/users/labs/LabHome';
import LabDashboard from '../pages/users/labs/dashboard/dashboard';
import LabBatches from '../pages/users/labs/batches/batches';
import LabTesting from '../pages/users/labs/testing/testing';
import LabReports from '../pages/users/labs/reports/reports';
import LabProfile from '../pages/users/labs/profile/profile';
import LabsPage from '../pages/users/labs/labs';
import LabQueue from '../pages/users/labs/lab_flow/LabQueue';
import LabBatchDetail from '../pages/users/labs/lab_flow/LabBatchDetail';
import LabSampleCreate from '../pages/users/labs/lab_flow/LabSampleCreate';
import LabTestCreate from '../pages/users/labs/lab_flow/LabTestCreate';
import LabTestEntry from '../pages/users/labs/lab_flow/LabTestEntry';
import LabCertificate from '../pages/users/labs/lab_flow/LabCertificate';
import LabReject from '../pages/users/labs/lab_flow/LabReject';

// ─── Manufacturer screens ───────────────────────────────────────────────────
import ManufacturerHome from '../pages/users/manufacturers/ManufacturerHome';
import ManufacturerDashboard from '../pages/users/manufacturers/dashboard/dashboard';
import RawHerbManagement from '../pages/users/manufacturers/raw_herb_management/raw_herb_management';
import QRScannerScreen from '../pages/users/manufacturers/raw_herb_management/QRScannerScreen';
import ProductionPage from '../pages/users/manufacturers/production/production';
import ManufacturerReports from '../pages/users/manufacturers/reports/reports';
import ManufacturerProfile from '../pages/users/manufacturers/profile/profile';

// ─── Admin screens ──────────────────────────────────────────────────────────
import AdminHome from '../pages/users/admins/AdminHome';
import AdminDashboard from '../pages/users/admins/dashboard/dashboard';
import UserManagement from '../pages/users/admins/user_control/user_management';
import ProfileSettings from '../pages/users/admins/user_control/profile_settings';
import CompliancePage from '../pages/users/admins/compliance/index';
import AlertsRecall from '../pages/users/admins/compliance/alerts_recall';
import ComplianceRegulation from '../pages/users/admins/compliance/compliance_regulation';
import ReportsAnalytics from '../pages/users/admins/reports/reports_analytics';
import IncentivesFunding from '../pages/users/admins/reports/incentives_funding';
import BatchTraceability from '../pages/users/admins/dashboard_monitoring/batch_traceability';
import AdminDashboardMonitor from '../pages/users/admins/dashboard_monitoring/dashboard';
import IntegrationAPI from '../pages/users/admins/integration/integration_api';
import SupportDispute from '../pages/users/admins/integration/support_dispute';

// ─── Consumer screens ───────────────────────────────────────────────────────
import ConsumerHome from '../pages/users/consumers/ConsumerHome';
import ConsumerDashboard from '../pages/users/consumers/dashboard/dashboard';

// ═════════════════════════════════════════════════════════════════════════════
// Navigators
// ═════════════════════════════════════════════════════════════════════════════

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab icon helper ────────────────────────────────────────────────────────
const TAB_ICONS = {
  Home: '🏠', Dashboard: '📊', Batches: '📦', Requests: '📋', Scanner: '📷',
  Notifications: '🔔', Profile: '👤', Settings: '⚙️', Marketplace: '🛒',
  Inventory: '🏭', Products: '🏷️', Traceability: '🔍', Users: '👥',
  Compliance: '⚖️', Reports: '📈', Trips: '🚚', Testing: '🧪',
  Certificates: '📜', Support: '💬', Sync: '📡',
};

function TabIcon({ label, focused }) {
  const icon = TAB_ICONS[label] || '•';
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </Text>
  );
}

function makeTabOptions(label) {
  return {
    tabBarIcon: ({ focused }) => <TabIcon label={label} focused={focused} />,
    tabBarLabel: label,
    tabBarActiveTintColor: '#10B981',
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: { paddingBottom: 4, height: 56 },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Per-role tab navigators
// ═════════════════════════════════════════════════════════════════════════════

function FarmerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={FarmerHome} options={makeTabOptions('Home')} />
      <Tab.Screen name="Batches" options={makeTabOptions('Batches')}>
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="BatchList" component={BatchList} />
            <Stack.Screen name="BatchDetail" component={BatchDetail} />
            <Stack.Screen name="FarmerQR" component={FarmerQR} />
            <Stack.Screen name="HerbList" component={HerbListScreen} />
            <Stack.Screen name="HerbRegister" component={HerbRegisterScreen} />
            <Stack.Screen name="HerbDetails" component={HerbDetailsScreen} />
            <Stack.Screen name="BatchSplit" component={BatchSplitScreen} />
            <Stack.Screen name="SmartRegister" component={SmartRegisterScreen} />
            <Stack.Screen name="Catalogue" component={CatalogueScreen} />
            <Stack.Screen name="CatalogueDetail" component={CatalogueDetailScreen} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Requests" options={makeTabOptions('Requests')}>
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TransferRequests" component={TransferRequests} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Notifications" component={FarmerNotifications} options={makeTabOptions('Notifications')} />
      <Tab.Screen name="Profile" options={makeTabOptions('Profile')}>
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FarmerProfileMain" component={FarmerProfile} />
            <Stack.Screen name="FarmProfile" component={FarmProfileScreen} />
            <Stack.Screen name="CropCalendar" component={CropCalendarScreen} />
            <Stack.Screen name="Weather" component={isEnabled('weather') ? WeatherScreen : (() => <ComingSoonScreen featureName="Weather" />)} />
            <Stack.Screen name="Prices" component={isEnabled('prices') ? PricesScreen : (() => <ComingSoonScreen featureName="Prices" />)} />
            <Stack.Screen name="Training" component={isEnabled('trainings') ? FarmerTraining : (() => <ComingSoonScreen featureName="Trainings" />)} />
            <Stack.Screen name="Payments" component={isEnabled('payments') ? FarmerPayments : (() => <ComingSoonScreen featureName="Payments" />)} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="OfflineSync" component={OfflineSyncScreen} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function TransporterTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={TransporterHome} options={makeTabOptions('Dashboard')} />
      <Tab.Screen name="Trips" options={makeTabOptions('Trips')}>
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TripsList" component={TripsPage} />
            <Stack.Screen name="ShipmentDetail" component={ShipmentDetail} />
            <Stack.Screen name="PickupCapture" component={PickupCapture} />
            <Stack.Screen name="DeliveryConfirm" component={DeliveryConfirm} />
            <Stack.Screen name="DeliveryFailure" component={DeliveryFailure} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Scanner" options={makeTabOptions('Scanner')}>
        {() => <ComingSoonScreen featureName="QR Scanner" />}
      </Tab.Screen>
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={makeTabOptions('Notifications')} />
      <Tab.Screen name="Profile" options={makeTabOptions('Profile')}>
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TransporterProfileMain" component={TransporterProfile} />
            <Stack.Screen name="TransporterReports" component={isEnabled('reports') ? TransporterReports : (() => <ComingSoonScreen featureName="Reports" />)} />
            <Stack.Screen name="TransporterPayments" component={isEnabled('payments') ? TransporterPayments : (() => <ComingSoonScreen featureName="Payments" />)} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="OfflineSync" component={OfflineSyncScreen} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function LabTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={LabHome} options={makeTabOptions('Dashboard')} />
      <Tab.Screen name="Batches" options={makeTabOptions('Batches')}>
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LabQueue" component={LabQueue} />
            <Stack.Screen name="LabBatchDetail" component={LabBatchDetail} />
            <Stack.Screen name="LabSampleCreate" component={LabSampleCreate} />
            <Stack.Screen name="LabTestCreate" component={LabTestCreate} />
            <Stack.Screen name="LabTestEntry" component={LabTestEntry} />
            <Stack.Screen name="LabCertificate" component={LabCertificate} />
            <Stack.Screen name="LabReject" component={LabReject} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Testing" component={LabTesting} options={makeTabOptions('Testing')} />
      <Tab.Screen name="Certificates" options={makeTabOptions('Certificates')}>
        {() => <ComingSoonScreen featureName="Certificates" />}
      </Tab.Screen>
      <Tab.Screen name="Reports" component={LabReports} options={makeTabOptions('Reports')} />
    </Tab.Navigator>
  );
}

function ManufacturerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={ManufacturerHome} options={makeTabOptions('Dashboard')} />
      <Tab.Screen name="Marketplace" component={RawHerbManagement} options={makeTabOptions('Marketplace')} />
      <Tab.Screen name="Inventory" options={makeTabOptions('Inventory')}>
        {() => <ComingSoonScreen featureName="Inventory" />}
      </Tab.Screen>
      <Tab.Screen name="Products" component={ProductionPage} options={makeTabOptions('Products')} />
      <Tab.Screen name="Reports" component={ManufacturerReports} options={makeTabOptions('Reports')} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={AdminHome} options={makeTabOptions('Dashboard')} />
      <Tab.Screen name="Users" component={UserManagement} options={makeTabOptions('Users')} />
      <Tab.Screen name="Compliance" component={CompliancePage} options={makeTabOptions('Compliance')} />
      <Tab.Screen name="Reports" component={ReportsAnalytics} options={makeTabOptions('Reports')} />
      <Tab.Screen name="Settings" options={makeTabOptions('Settings')}>
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminSettingsMain" component={SettingsScreen} />
            <Stack.Screen name="ProfileSettings" component={ProfileSettings} />
            <Stack.Screen name="Integration" component={IntegrationAPI} />
            <Stack.Screen name="SupportDispute" component={SupportDispute} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Consumer: stack-only, no tabs (no login required)
function ConsumerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConsumerHome" component={ConsumerHome} />
      <Stack.Screen name="ConsumerDashboard" component={ConsumerDashboard} />
    </Stack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Auth stack
// ═════════════════════════════════════════════════════════════════════════════

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, gestureEnabled: true }}
    >
      <Stack.Screen name="Login" component={PerfectLoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Role → tab navigator map
// ═════════════════════════════════════════════════════════════════════════════

const ROLE_TABS = {
  farmer: FarmerTabs,
  transporter: TransporterTabs,
  lab: LabTabs,
  manufacturer: ManufacturerTabs,
  admin: AdminTabs,
  consumer: ConsumerStack,
};

// ═════════════════════════════════════════════════════════════════════════════
// AuthGate — route guard
// ═════════════════════════════════════════════════════════════════════════════

function AuthGate() {
  const { ready, isLoggedIn, role } = useAuth();

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (isLoggedIn) {
    const RoleNav = ROLE_TABS[role] || ConsumerStack;
    return <RoleNav />;
  }

  return <AuthStack />;
}

// ═════════════════════════════════════════════════════════════════════════════
// Root navigator
// ═════════════════════════════════════════════════════════════════════════════

const AppNavigator = () => {
  return (
    <GlobalTranslationProvider>
      <NavigationContainer>
        <AuthGate />
      </NavigationContainer>
    </GlobalTranslationProvider>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
});

export default AppNavigator;
