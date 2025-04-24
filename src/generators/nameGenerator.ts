export class NameGenerator {
    private prefixes: string[] = [
      'Green', 'Red', 'Blue', 'Black', 'White', 'Silver', 'Gold', 'Iron',
      'Stone', 'River', 'Lake', 'Hill', 'Mountain', 'East', 'West', 'North',
      'South', 'Old', 'New', 'High', 'Low', 'Royal', 'Far', 'Deep', 'Bright',
      'Dark', 'Fair', 'Shadow', 'Sun', 'Moon', 'Star', 'Wolf', 'Bear', 'Deer',
      'Hawk', 'Eagle', 'Raven', 'Golden', 'Silver', 'Oak', 'Pine', 'Maple',
      'Winter', 'Summer', 'Spring', 'Autumn', 'Frost', 'Wind', 'Storm'
    ];
  
    private suffixes: string[] = [
      'wood', 'water', 'ford', 'bridge', 'ton', 'wick', 'ham', 'bury',
      'field', 'vale', 'dale', 'haven', 'gate', 'cross', 'watch', 'port',
      'harbor', 'keep', 'fall', 'spring', 'grove', 'ridge', 'stone', 'ville',
      'borough', 'shire', 'castle', 'fort', 'hold', 'landing', 'reach', 'run',
      'crest', 'peak', 'hollow', 'glen', 'moor', 'point', 'shore', 'bay',
      'hill', 'cliff', 'town', 'view', 'side', 'rest', 'pass', 'haven', 'mead'
    ];
  
    /**
     * Generates a random settlement name
     */
    generateSettlementName(): string {
      const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
      const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
      
      return prefix + suffix;
    }
  
    /**
     * Generates a set of alternative name options
     */
    generateNameOptions(count: number = 5): string[] {
      const names: string[] = [];
      
      for (let i = 0; i < count; i++) {
        names.push(this.generateSettlementName());
      }
      
      return names;
    }
  
    /**
     * Generates a themed name based on a given type
     */
    generateThemedName(type: string): string {
      let selectedPrefixes: string[] = this.prefixes;
      let selectedSuffixes: string[] = this.suffixes;
      
      // Customize prefixes and suffixes based on settlement type
      if (type === 'village') {
        selectedPrefixes = [
          'Green', 'Little', 'Oak', 'Mill', 'Apple', 'West', 'East', 'North',
          'South', 'River', 'Stone', 'Red', 'White', 'Blue', 'New', 'Old'
        ];
        
        selectedSuffixes = [
          'field', 'vale', 'dale', 'hill', 'wood', 'brook', 'thorpe',
          'ton', 'wick', 'ham', 'mead', 'stead', 'ford', 'cross'
        ];
      } else if (type === 'city') {
        selectedPrefixes = [
          'High', 'Royal', 'Grand', 'King\'s', 'Queen\'s', 'Great', 'Capital',
          'Imperial', 'Golden', 'Silver', 'Star', 'Iron', 'Crown', 'Tower'
        ];
        
        selectedSuffixes = [
          'haven', 'port', 'keep', 'gate', 'castle', 'moor', 'spire', 'reach',
          'hold', 'point', 'throne', 'shire', 'court', 'bridge', 'watch'
        ];
      }
      
      const prefix = selectedPrefixes[Math.floor(Math.random() * selectedPrefixes.length)];
      const suffix = selectedSuffixes[Math.floor(Math.random() * selectedSuffixes.length)];
      
      return prefix + suffix;
    }
  }