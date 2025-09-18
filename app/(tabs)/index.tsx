import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SquareCheck as CheckSquare, Square, Calendar, CircleAlert as AlertCircle, Trash2 } from 'lucide-react-native';
import { Todo } from '../../types/todo';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function TodoListScreen() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const todosData = await ApiService.getTodos();
      setTodos(todosData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const updatedTodo = await ApiService.updateTodo(todo._id, {
        completed: !todo.completed,
      });
      
      setTodos(todos.map(t => t._id === todo._id ? updatedTodo : t));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const deleteTodo = async (todoId: string) => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteTodo(todoId);
              setTodos(todos.filter(t => t._id !== todoId));
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete todo');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoCard}>
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => toggleTodo(item)}
      >
        <View style={styles.todoHeader}>
          <View style={styles.todoLeft}>
            {item.completed ? (
              <CheckSquare size={24} color="#10b981" />
            ) : (
              <Square size={24} color="#6b7280" />
            )}
            <View style={styles.todoText}>
              <Text style={[
                styles.todoTitle,
                item.completed && styles.completedTitle
              ]}>
                {item.title}
              </Text>
              {item.description && (
                <Text style={[
                  styles.todoDescription,
                  item.completed && styles.completedText
                ]}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.todoRight}>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) }
            ]}>
              <Text style={styles.priorityText}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteTodo(item._id)}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        {item.dueDate && (
          <View style={styles.dueDateContainer}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.dueDate}>
              Due: {formatDate(item.dueDate)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Todos</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.name}!</Text>
      </View>

      {todos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No todos yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first todo to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderTodo}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3b82f6']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  todoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todoContent: {
    padding: 16,
  },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  todoLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  todoText: {
    marginLeft: 12,
    flex: 1,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  todoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  completedText: {
    color: '#9ca3af',
  },
  todoRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dueDate: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});