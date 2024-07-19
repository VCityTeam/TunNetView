class addLine:

    def __init__(self, file, outfile, scale, offset_x, offset_y, offset_z):
        self.file = file
        self.outfile = outfile
        self.scale = scale
        self.offset_x = offset_x
        self.offset_y = offset_y
        self.offset_z = offset_z
        with open(file, 'r') as f:  # Utilisation de 'with' pour une gestion automatique de la fermeture du fichier
            self.__search(f)
            
            
    def __search(self, f):
        lines = f.readlines()  # Read all lines at once to avoid issues with nested iteration
        
        for i in range(len(lines)):
            x1, y1, z1 = lines[i].strip().split()
            x1 = int(x1)
            y1 = int(y1)
            z1 = int(z1)
            proche = []
            for j in range(len(lines)):
                if i == j:
                    continue  # Skip comparing the same line
                x2, y2, z2 = lines[j].strip().split()
                x2 = int(x2)
                y2 = int(y2)
                z2 = int(z2)
                if distUn(x1, y1, z1, x2, y2, z2): 
                    self.outfile.write(f'l {i+1} {j+1}\n')
        #            proche.append(lines[j].strip())
        #    print(f"Point ({x1}, {y1}, {z1}) has close points: {proche}")
        #    
        #    
        #    for line in proche:
        #        x1_scaled = float(x1) / self.scale - self.offset_x
        #        y1_scaled = float(y1) / self.scale - self.offset_y
        #        z1_scaled = float(z1) / self.scale - self.offset_z
        #        x2, y2, z2 = line.strip().split()
        #        x2_scaled = float(x2) / self.scale - self.offset_x
        #        y2_scaled = float(y2) / self.scale - self.offset_y
        #        z2_scaled = float(z2) / self.scale - self.offset_z                    
        #        print(f"Point ({x1_scaled}, {y1_scaled}, {z1_scaled}) has close points: {x2_scaled}, {y2_scaled}, {z2_scaled}")
        #        self.outfile.write(f'l {x1_scaled} {y1_scaled} {z1_scaled} {x2_scaled} {y2_scaled} {z2_scaled}\n')

def distUn(x1, y1, z1, x2, y2, z2):
    return (abs(x1 - x2) <= 1) and (abs(y1 - y2) <= 1) and (abs(z1 - z2) <= 1)