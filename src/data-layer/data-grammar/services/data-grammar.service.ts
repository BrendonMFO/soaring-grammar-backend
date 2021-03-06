import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import { Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GrammarWordDto } from '../dtos/grammar-word.dto';
import { classToClassFromExist } from 'class-transformer';
import { Bind } from 'src/common/decorators/bind.decorator';
import { GrammarPhraseDto } from '../dtos/grammar-phrase.dto';
import { GrammarWordEntity } from '../entities/grammar-word.entity';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';
import { GrammarPhraseEntity } from '../entities/grammar-phrase.entity';
import { GrammarWord } from '@core/grammar/interfaces/grammar-word.interface';
import { GrammarPhrase } from '@core/grammar/interfaces/grammar-phrase.interface';
import { GrammarDataService } from '@core/grammar/interfaces/grammar-data-service.interface';

@Injectable()
export class DataGrammarService implements GrammarDataService {
  @InjectRepository(GrammarWordEntity)
  private readonly grammarWordRepository: Repository<GrammarWordEntity>;

  @InjectRepository(GrammarPhraseEntity)
  private readonly grammarPhraseRepository: Repository<GrammarPhraseEntity>;

  getGrammarPhraseById(id: string): Promise<GrammarPhrase> {
    return this.grammarPhraseRepository.findOneOrFail(id);
  }

  getCompletedGrammarByUser(userId: number): Promise<GrammarPhrase[]> {
    return this.grammarPhraseRepository.find({
      relations: ['grammarWord'],
      join: { alias: 'phrases', innerJoin: { word: 'phrases.grammarWord' } },
      where: (qb) => {
        qb.where({
          synthesized: true,
          translatedPhrase: Not(IsNull()),
        }).andWhere('word.userId = :userId', { userId });
      },
    });
  }

  @Sanitize()
  save(
    @Bind(GrammarPhraseDto) grammarPhrase: GrammarPhrase,
  ): Promise<GrammarPhrase> {
    return this.grammarPhraseRepository.save(grammarPhrase);
  }

  @Sanitize()
  syncGrammar(
    userId: number,
    @Bind(GrammarWordDto) grammarWords: GrammarWord[],
  ): Promise<GrammarWordEntity[]> {
    return Promise.all(
      grammarWords.map(async (grammarWord) => {
        const previousWord = await this.grammarWordRepository.findOne(
          grammarWord.id,
          { relations: ['phrases'] },
        );
        const newData = { userId, ...grammarWord } as GrammarWordEntity;
        const newWord = previousWord
          ? classToClassFromExist(newData, previousWord)
          : newData;
        return this.grammarWordRepository.save(newWord);
      }),
    );
  }

  paginate(
    userId: number,
    options: IPaginationOptions,
  ): Promise<Pagination<GrammarWordEntity>> {
    return paginate<GrammarWordEntity>(this.grammarWordRepository, options, {
      userId,
      relations: ['phrases'],
    });
  }
}
