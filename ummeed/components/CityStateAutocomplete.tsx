import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Input } from './Input';
import { CITIES_AND_STATES, CityState } from '../lib/cities';
import { colors, spacing, radius, font } from '../theme';

interface Props {
  city: string;
  setCity: (city: string) => void;
  state: string;
  setState: (state: string) => void;
  cityTestID?: string;
  stateTestID?: string;
}

export function CityStateAutocomplete({
  city,
  setCity,
  state,
  setState,
  cityTestID,
  stateTestID,
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<CityState[]>([]);

  const handleCityChange = (text: string) => {
    setCity(text);
    if (!text.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = CITIES_AND_STATES.filter((item) =>
      item.city.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 5); // limit to 5 suggestions for cleaner UI

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSelect = (item: CityState) => {
    setCity(item.city);
    setState(item.state);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* City Input (with suggestions dropdown) */}
        <View style={styles.columnLeft}>
          <Input
            label="City"
            value={city}
            onChangeText={handleCityChange}
            placeholder="Search city..."
            onFocus={() => {
              if (city.trim()) {
                handleCityChange(city);
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow TouchableOpacity onPress to register
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            testID={cityTestID}
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {suggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionItem}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.suggestionText}>
                      {item.city}, <Text style={styles.stateText}>{item.state}</Text>
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* State Input */}
        <View style={styles.columnRight}>
          <Input
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="State"
            testID={stateTestID}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10, // Ensure zIndex is applied to container to allow child suggestions to float
  },
  row: {
    flexDirection: 'row',
  },
  columnLeft: {
    flex: 1,
    marginRight: spacing.sm,
    position: 'relative',
  },
  columnRight: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 90, // Positioned below the Input text box
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radius.md,
    maxHeight: 200,
    zIndex: 999, // Floating on top of other content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: font.weightSemi,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: font.weightReg,
  },
});
